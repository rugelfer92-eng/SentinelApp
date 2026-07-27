#include <Arduino.h>
#include <DHT.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ------------------- Pines -------------------
#define DHT_PIN 4
#define RELAY_PIN 5
#define ZMPT_PIN 32
#define BUZZER_PIN 18
#define DHTTYPE DHT22

// ------------------- BLE -------------------
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_MTU 185

// ------------------- Configuración -------------------
float tempMin = 10.0;
float tempMax = 15.0;
float tempInter = 5.0;
float voltMin = 90.0;
float voltMax = 130.0;
float humMin  = 40.0;
float humMax  = 85.0;
bool modoManual   = false;
bool estadoManual = false;

// ------------------- Protección compresor -------------------
unsigned long lastOffTime = 0;
const unsigned long COMPRESSOR_DELAY = 180000;

// ------------------- Estado del sistema -------------------
enum EstadoSistema {
    IDLE,
    ENFRIANDO,
    PROTECCION_VOLT,
    ESPERA_COMPRESOR,
    ERROR_SENSOR
};
EstadoSistema estadoActual = IDLE;

// ------------------- Sensores -------------------
DHT dht(DHT_PIN, DHTTYPE);

// ------------------- BLE -------------------
BLEServer         *pServer          = nullptr;
BLECharacteristic *pCharacteristic  = nullptr;
bool deviceConnected = false;

// ------------------- Voltaje -------------------
float leerVoltajeAC() {
    const int muestras = 600;
    float suma = 0;
    for (int i = 0; i < muestras; i++) {
        int   raw  = analogRead(ZMPT_PIN);
        float v    = raw - 2048;
        suma      += v * v;
        delayMicroseconds(50);
    }
    float vrms        = sqrt(suma / muestras);
    float voltajeReal = vrms * 0.158;
    return voltajeReal;
}

// ------------------- Funciones compresor -------------------
// Prototipo para el buzzer (definida más abajo)
void beepShorts(int count);
bool puedeEncenderCompresor() {
    return (millis() - lastOffTime) > COMPRESSOR_DELAY;
}
void encenderCompresor() {
    digitalWrite(RELAY_PIN, LOW);
    // Pitido corto al encender
    beepShorts(1);
    estadoActual = ENFRIANDO;
}
void apagarCompresor() {
    digitalWrite(RELAY_PIN, HIGH);
    // Pitido corto al apagar
    beepShorts(1);
    lastOffTime  = millis();
    estadoActual = IDLE;
}

// ------------------- Buzzer -------------------
void beepShorts(int count) {
    for (int i = 0; i < count; ++i) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        delay(100);
    }
}

// ------------------- Helper JSON -------------------
int extraerBool(String json, String clave) {
    if (json.indexOf("\"" + clave + "\":true")  >= 0) return 1;
    if (json.indexOf("\"" + clave + "\":false") >= 0) return 0;
    return -1;
}

// ------------------- BLE Callbacks -------------------
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pSrv) override {
        deviceConnected = true;
        Serial.println("App conectada");
    }
    void onDisconnect(BLEServer* pSrv) override {
        deviceConnected = false;
        Serial.println("App desconectada — reiniciando publicidad...");
        pSrv->getAdvertising()->start();
    }
};

class MyCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pChar) override {
        std::string value = pChar->getValue();
        if (value.length() == 0) return;

        String data = "";
        for (char c : value) data += c;
        Serial.println("Recibido: " + data);

        data.replace("\r", "");
        data.replace("\n", "");
        data.trim();
        if (data.length() >= 2 && data.charAt(0) == '"' && data.charAt(data.length() - 1) == '"') {
            data = data.substring(1, data.length() - 1);
        }

        if (data.startsWith("CONF:")) {
            String payload = data.substring(5);
            String v[9];
            int idx = 0;
            for (int i = 0; i < payload.length() && idx < 9; i++) {
                if (payload[i] == ',') idx++;
                else v[idx] += payload[i];
            }
            if (idx == 8) {
                for (int j = 0; j < 9; j++) v[j].trim();
                tempMax      = v[0].toFloat();
                tempMin      = v[1].toFloat();
                tempInter    = v[2].toFloat();  // intervalo antes de re-encender
                voltMax      = v[3].toFloat();
                voltMin      = v[4].toFloat();
                humMax       = v[5].toFloat();
                humMin       = v[6].toFloat();
                modoManual   = v[7].toInt();
                estadoManual = v[8].toInt();
                Serial.printf("Config: Temp %.1f-%.1f (inter %.1f) | Volt %.1f-%.1f | Hum %.1f-%.1f\n",
                              tempMin, tempMax, tempInter, voltMin, voltMax, humMin, humMax);
            } else {
                Serial.println("CONF mal formateado (esperados 9 valores)");
            }
            return;
        }

        if (data.indexOf("\"type\":\"relay\"") >= 0) {
            int estado = extraerBool(data, "state");
            if (estado == 1) {
                modoManual = true; estadoManual = true;
                if (!puedeEncenderCompresor()) {
                    Serial.println("Relay ON ignorado: periodo de proteccion activo");
                    return;
                }
                if (estadoActual == PROTECCION_VOLT) {
                    Serial.println("Relay ON ignorado: proteccion por voltaje activa");
                    return;
                }
                encenderCompresor();
                Serial.println("Relay ON (manual desde App)");
            } else if (estado == 0) {
                modoManual = true; estadoManual = false;
                apagarCompresor();
                Serial.println("Relay OFF (manual desde App)");
            } else {
                Serial.println("Relay: no se encontró 'state'");
            }
            return;
        }

        if (data.indexOf("\"type\":\"auto\"") >= 0) {
            modoManual = false; estadoManual = false;
            Serial.println("Modo automático activado");
            return;
        }

        Serial.println("Comando no reconocido: " + data);
    }
};

// ------------------- SETUP -------------------
void setup() {
    Serial.begin(115200);

    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);

    // Evitar que el compresor se encienda inmediatamente al arrancar
    lastOffTime = millis();

    dht.begin();

    BLEDevice::init("ESP32-Sentinel");
    BLEDevice::setMTU(BLE_MTU);

    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ   |
        BLECharacteristic::PROPERTY_WRITE  |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pCharacteristic->setCallbacks(new MyCallbacks());
    pCharacteristic->addDescriptor(new BLE2902());

    pService->start();
    pServer->getAdvertising()->start();

    Serial.println("Sentinel-Cold iniciado");
    Serial.printf("Temp: %.1f-%.1f C | Volt: %.1f-%.1fV\n",
                  tempMin, tempMax, voltMin, voltMax);
}

int ciclo = 0;

// ------------------- LOOP -------------------
void loop() {
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
        apagarCompresor();
        estadoActual = ERROR_SENSOR;
        Serial.println("Error: sensor DHT22 no responde");
        delay(2000);
        return;
    }

    float volt  = leerVoltajeAC();
    int senVolt = analogRead(ZMPT_PIN);

    // ------------------- PROTECCION VOLTAJE -------------------
    if (volt < voltMin || volt > voltMax) {
        if (estadoActual != PROTECCION_VOLT) {
            Serial.println("⚠️ Falla de voltaje detectada: activando proteccion");
            apagarCompresor();
            lastOffTime = millis();
            estadoActual = PROTECCION_VOLT;
            // 3 pitidos cortos
            beepShorts(3);
        }
    } else {
        if (estadoActual == PROTECCION_VOLT && puedeEncenderCompresor()) {
            estadoActual = IDLE;
            Serial.println("✅ Proteccion por voltaje finalizada");
        }
    }

    // ------------------- CONTROL -------------------
    if (modoManual) {
        if (estadoManual) encenderCompresor();
        else              apagarCompresor();
    } else {
        if (temp <= tempMin) {
            apagarCompresor();
        }
        else if (temp >= (tempMin + tempInter)) {
            if (puedeEncenderCompresor()) encenderCompresor();
            else estadoActual = ESPERA_COMPRESOR;
        }
    }

    // ------------------- ENVIO BLE -------------------
    if (deviceConnected) {
        String json = "{";
        json += "\"temp\":"   + String(temp, 1) + ",";
        json += "\"hum\":"    + String(hum,  1) + ",";
        json += "\"volt\":"   + String(volt, 1) + ",";
        json += "\"relay\":"  + String(digitalRead(RELAY_PIN)) + ",";
        json += "\"estado\":" + String((int)estadoActual);
        json += "}";

        pCharacteristic->setValue(json.c_str());
        pCharacteristic->notify();
    }

    // ------------------- DEBUG (cada 10 ciclos = ~1 seg) -------------------
    unsigned long tiempoRestante = 0;
    if (!puedeEncenderCompresor())
        tiempoRestante = (COMPRESSOR_DELAY - (millis() - lastOffTime)) / 1000;

    if (ciclo == 10) {
        Serial.println("\n------------ Sentinel-Cold ------------");
        // Datos en tiempo real
        Serial.printf("Temp: %.1fC | Hum: %.1f%% | Volt: %.1fV\n", temp, hum, volt);
        Serial.printf("Compresor: %s | Modo: %s\n", digitalRead(RELAY_PIN) == LOW ? "ON" : "OFF", modoManual ? "MANUAL" : "AUTO");
        // Configuración activa
        Serial.println("-- Config activa --");
        Serial.printf("Temp:  %.1fC min  /  %.1fC max\n", tempMin, tempMax);
        Serial.printf("Volt:  %.1fV min  /  %.1fV max\n", voltMin, voltMax);
        Serial.printf("Hum:   %.1f%% min  /  %.1f%% max\n", humMin, humMax);
        // Protección compresor
        if (tiempoRestante > 0)
            Serial.printf("Espera compresor: %lu seg\n", tiempoRestante);
        ciclo = 0;
    }

    ciclo++;
    delay(100);
}
