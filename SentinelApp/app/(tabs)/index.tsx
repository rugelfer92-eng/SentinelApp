import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getLatestData, SensorData } from "../../src/api/sensorService";
import { useBluetooth } from "../../src/bluetooth/BluetoothContext";
import { useConfig } from "../../src/context/ConfigContext";
import { useRelayControl } from "../../src/hooks/useRelayControl";
import { presentNotification } from "../../src/notifications/notificationService";
import { colors, styles } from "../../src/theme/globalStyles";
import { homeStyles } from "../../src/theme/indexStyles"; // <-- Importamos los nuevos estilos planos

export default function HomeScreen() {
  const {
    sensorData: bleSensorData,
    isConnected,
    isScanning,
    connect,
  } = useBluetooth();
  const { isRelayOn, toggleRelay, isChanging } = useRelayControl();
  const { config } = useConfig();
  const [webSensorData, setWebSensorData] = useState<SensorData | null>(null);
  const [webLoading, setWebLoading] = useState(false);
  const isWeb = Platform.OS === "web";
  const sensorData = isWeb ? webSensorData : bleSensorData;
  const displayedIsConnected = isWeb ? true : isConnected;
  const displayedIsScanning = isWeb ? false : isScanning;

  const isTempHigh = (sensorData?.temperatura ?? 0) > config.temp_max;
  const isTempLow = (sensorData?.temperatura ?? 0) < config.temp_min;
  const isVoltAlert =
    (sensorData?.voltaje ?? 0) < config.volt_min ||
    (sensorData?.voltaje ?? 0) > config.volt_max;
  const isHumHigh = (sensorData?.humedad ?? 0) > config.hum_max;
  const isTempAlert = isTempHigh || isTempLow;

  const hasAlertedVoltRef = useRef(false);
  const tempAlertStartRef = useRef<number | null>(null);
  const hasAlertedTempRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!sensorData) {
      tempAlertStartRef.current = null;
      hasAlertedTempRef.current = false;
      return;
    }

    if (isVoltAlert && !hasAlertedVoltRef.current) {
      const message =
        sensorData.voltaje < config.volt_min
          ? `Voltaje bajo detectado: ${sensorData.voltaje.toFixed(1)}V`
          : `Voltaje alto detectado: ${sensorData.voltaje.toFixed(1)}V`;

      if (Platform.OS === "web") {
        alert(message);
      } else {
        presentNotification("Alerta de voltaje", message);
      }

      hasAlertedVoltRef.current = true;
    }

    if (!isVoltAlert) {
      hasAlertedVoltRef.current = false;
    }

    if (isTempAlert) {
      if (tempAlertStartRef.current === null) {
        tempAlertStartRef.current = Date.now();
      }

      const elapsed = Date.now() - (tempAlertStartRef.current ?? 0);
      if (elapsed >= 10 * 60 * 1000 && !hasAlertedTempRef.current) {
        const message = isTempLow
          ? `Temperatura baja persistente: ${sensorData.temperatura.toFixed(1)}°C`
          : `Temperatura alta persistente: ${sensorData.temperatura.toFixed(1)}°C`;

        if (Platform.OS === "web") {
          alert(message);
        } else {
          presentNotification("Alerta de temperatura", message);
        }

        hasAlertedTempRef.current = true;
      }
    } else {
      tempAlertStartRef.current = null;
      hasAlertedTempRef.current = false;
    }
  }, [
    sensorData,
    config.temp_min,
    config.temp_max,
    config.volt_min,
    config.volt_max,
    isTempAlert,
    isTempHigh,
    isTempLow,
    isVoltAlert,
  ]);

  const fetchWebData = async () => {
    if (!isWeb) return;
    setWebLoading(true);
    const latest = await getLatestData();
    setWebSensorData(latest);
    setWebLoading(false);
  };

  useEffect(() => {
    if (!isWeb) return;

    fetchWebData();
    const interval = setInterval(fetchWebData, 15000);
    return () => clearInterval(interval);
  }, [isWeb]);

  return (
    <View style={homeStyles.pageContainer}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isWeb ? webLoading : isScanning}
            onRefresh={isWeb ? fetchWebData : connect}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={homeStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TARJETA TEMPERATURA ── */}
        <View style={homeStyles.cardSection}>
          <View
            style={[
              homeStyles.cardHeader,
              { backgroundColor: isTempAlert ? colors.error : "#2563eb" },
            ]}
          >
            <Text style={homeStyles.cardHeaderTitle}>TEMPERATURA</Text>
            <View
              style={[
                homeStyles.statusIndicator,
                { backgroundColor: isTempAlert ? "#ffffff" : "#34d399" },
              ]}
            />
          </View>
          <View style={homeStyles.cardBody}>
            <Text style={homeStyles.valueSubtext}>Valor en tiempo real</Text>
            <Text
              style={[
                homeStyles.valueText,
                { color: isTempAlert ? colors.error : "#1e293b" },
              ]}
            >
              {sensorData ? `${sensorData.temperatura.toFixed(1)}°C` : "--"}
            </Text>

            <View style={homeStyles.infoRow}>
              <View style={homeStyles.rangeBadge}>
                <Text style={homeStyles.rangeText}>
                  Rango: {config.temp_min}°C – {config.temp_max}°C
                </Text>
              </View>
              {isTempHigh && (
                <View
                  style={[
                    homeStyles.alertBadge,
                    { backgroundColor: "#fee2e2" },
                  ]}
                >
                  <Text style={[homeStyles.alertText, { color: colors.error }]}>
                    ⚠ TEMP ALTA
                  </Text>
                </View>
              )}
              {isTempLow && (
                <View
                  style={[
                    homeStyles.alertBadge,
                    { backgroundColor: "#dbeafe" },
                  ]}
                >
                  <Text
                    style={[homeStyles.alertText, { color: colors.primary }]}
                  >
                    ⚠ TEMP BAJA
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── TARJETA HUMEDAD ── */}
        <View style={homeStyles.cardSection}>
          <View
            style={[
              homeStyles.cardHeader,
              { backgroundColor: isHumHigh ? colors.error : "#059669" },
            ]}
          >
            <Text style={homeStyles.cardHeaderTitle}>HUMEDAD</Text>
            <View
              style={[
                homeStyles.statusIndicator,
                { backgroundColor: isHumHigh ? "#ffffff" : "#34d399" },
              ]}
            />
          </View>
          <View style={homeStyles.cardBody}>
            <Text style={homeStyles.valueSubtext}>Valor en tiempo real</Text>
            <Text
              style={[
                homeStyles.valueText,
                { color: isHumHigh ? colors.error : "#1e293b" },
              ]}
            >
              {sensorData ? `${sensorData.humedad.toFixed(1)}%` : "--"}
            </Text>

            <View style={homeStyles.infoRow}>
              <View style={homeStyles.rangeBadge}>
                <Text style={homeStyles.rangeText}>
                  Rango: {config.hum_min}% – {config.hum_max}%
                </Text>
              </View>
              {isHumHigh && (
                <View
                  style={[
                    homeStyles.alertBadge,
                    { backgroundColor: "#fee2e2" },
                  ]}
                >
                  <Text style={[homeStyles.alertText, { color: colors.error }]}>
                    ⚠ HUMEDAD ALTA
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── TARJETA VOLTAJE ── */}
        <View style={homeStyles.cardSection}>
          <View
            style={[
              homeStyles.cardHeader,
              { backgroundColor: isVoltAlert ? colors.warning : "#f59e0b" },
            ]}
          >
            <Text style={homeStyles.cardHeaderTitle}>VOLTAJE</Text>
            <View
              style={[
                homeStyles.statusIndicator,
                { backgroundColor: isVoltAlert ? "#ffffff" : "#34d399" },
              ]}
            />
          </View>
          <View style={homeStyles.cardBody}>
            <Text style={homeStyles.valueSubtext}>Valor en tiempo real</Text>
            <Text
              style={[
                homeStyles.valueText,
                { color: isVoltAlert ? colors.warning : "#1e293b" },
              ]}
            >
              {sensorData ? `${sensorData.voltaje.toFixed(1)}V` : "--"}
            </Text>

            <View style={homeStyles.infoRow}>
              <View style={homeStyles.rangeBadge}>
                <Text style={homeStyles.rangeText}>
                  Seguro: {config.volt_min}V – {config.volt_max}V
                </Text>
              </View>
              {isVoltAlert && (
                <View
                  style={[
                    homeStyles.alertBadge,
                    { backgroundColor: "#fef9c3" },
                  ]}
                >
                  <Text style={[homeStyles.alertText, { color: "#92400e" }]}>
                    ⚠ VOLTAJE ANORMAL
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── TARJETA COMPRESOR ── */}
        <View style={homeStyles.cardSection}>
          <View
            style={[
              homeStyles.cardHeader,
              { backgroundColor: isRelayOn ? colors.secondary : "#64748b" },
            ]}
          >
            <Text style={homeStyles.cardHeaderTitle}>COMPRESOR</Text>
            <View
              style={[
                homeStyles.statusIndicator,
                { backgroundColor: isRelayOn ? "#34d399" : "#ef4444" },
              ]}
            />
          </View>
          <View style={homeStyles.cardBody}>
            <Text style={homeStyles.valueSubtext}>Control manual</Text>
            <Text
              style={[
                homeStyles.valueText,
                { color: isRelayOn ? colors.secondary : colors.error },
              ]}
            >
              {isRelayOn ? "ENCENDIDO" : "APAGADO"}
            </Text>

            <TouchableOpacity
              onPress={toggleRelay}
              disabled={isWeb || isChanging || !displayedIsConnected}
              style={[
                homeStyles.controlButton,
                {
                  backgroundColor: isWeb
                    ? "#94a3b8"
                    : !displayedIsConnected
                      ? "#94a3b8"
                      : isRelayOn
                        ? colors.error
                        : colors.secondary,
                  opacity: isWeb || isChanging ? 0.6 : 1,
                },
              ]}
            >
              <Text style={homeStyles.controlButtonText}>
                {isChanging
                  ? "ENVIANDO..."
                  : !isConnected
                    ? "SIN CONEXIÓN"
                    : isRelayOn
                      ? "APAGAR COMPRESOR"
                      : "ENCENDER COMPRESOR"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SIN DATOS ── */}
        {!sensorData && !displayedIsScanning && (
          <View style={homeStyles.footerSection}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                color: colors.textSecondary,
                marginTop: 10,
                fontSize: 13,
              }}
            >
              {isWeb
                ? "Cargando datos más recientes del servidor..."
                : displayedIsConnected
                  ? "Esperando datos del ESP32..."
                  : "Sin conexión con el ESP32"}
            </Text>
            {isWeb ? (
              <TouchableOpacity
                onPress={fetchWebData}
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 25,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  ACTUALIZAR DATOS
                </Text>
              </TouchableOpacity>
            ) : !displayedIsConnected ? (
              <TouchableOpacity
                onPress={connect}
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 25,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  BUSCAR ESP32
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <Text style={styles.footerText}>Ubicación: Tucape, Panadería</Text>
        <Text style={styles.footerText}>
          {sensorData
            ? `Última lectura: ${new Date().toLocaleTimeString()}`
            : "Sin datos disponibles"}
        </Text>
      </ScrollView>
    </View>
  );
}
