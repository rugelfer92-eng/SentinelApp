import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { updateConfiguracion } from "../../src/api/configService";
import { useAuth } from "../../src/auth/AuthContext";
import { useBluetooth } from "../../src/bluetooth/BluetoothContext";
import { useConfig } from "../../src/context/ConfigContext";
import { localStyles } from "../../src/theme/configStyles";
import { styles as globalStyles } from "../../src/theme/globalStyles";

export default function ConfigScreen() {
  const { sendMessage, isConnected } = useBluetooth();
  const { canConfig, user } = useAuth();
  const { config, setConfig, refreshConfig } = useConfig();

  const [tempMax, setTempMax] = useState("");
  const [tempMin, setTempMin] = useState("");
  const [voltMax, setVoltMax] = useState("");
  const [voltMin, setVoltMin] = useState("");
  const [humMax, setHumMax] = useState("");
  const [humMin, setHumMin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTempMax("");
    setTempMin("");
    setVoltMax("");
    setVoltMin("");
    setHumMax("");
    setHumMin("");
  }, [config]);

  if (!canConfig) {
    return (
      <View
        style={[globalStyles.containerWhite, localStyles.restrictedContainer]}
      >
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🔒</Text>
        <Text style={localStyles.restrictedTitle}>Acceso Restringido</Text>
        <Text style={localStyles.restrictedSubtitle}>
          No tienes permisos para modificar la configuración del sistema.
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!isConnected) {
      const msg = "No hay conexión con el ESP32";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Error", msg);
      return;
    }

    const finalTempMax = tempMax ? Number(tempMax) : config.temp_max;
    const finalTempMin = tempMin ? Number(tempMin) : config.temp_min;
    const finalVoltMax = voltMax ? Number(voltMax) : config.volt_max;
    const finalVoltMin = voltMin ? Number(voltMin) : config.volt_min;
    const finalHumMax = humMax ? Number(humMax) : config.hum_max;
    const finalHumMin = humMin ? Number(humMin) : config.hum_min;

    if (finalTempMin >= finalTempMax) {
      Alert.alert("Error", "Temp Mínima no puede ser ≥ Temp Máxima");
      return;
    }
    if (finalHumMin >= finalHumMax) {
      Alert.alert("Error", "Hum Mínima no puede ser ≥ Hum Máxima");
      return;
    }

    const nuevaConfig = {
      temp_max: finalTempMax,
      temp_min: finalTempMin,
      volt_max: finalVoltMax,
      volt_min: finalVoltMin,
      hum_max: finalHumMax,
      hum_min: finalHumMin,
    };

    setSaving(true);
    try {
      const configMessage = `CONF:${nuevaConfig.temp_max},${nuevaConfig.temp_min},${nuevaConfig.volt_max},${nuevaConfig.volt_min},${nuevaConfig.hum_max},${nuevaConfig.hum_min},0,0`;
      sendMessage(configMessage);

      setConfig(nuevaConfig);
      const success = await updateConfiguracion(nuevaConfig);
      if (!success) {
        throw new Error("No se pudo guardar la configuración en el servidor");
      }
      await refreshConfig();

      setTempMax("");
      setTempMin("");
      setVoltMax("");
      setVoltMin("");
      setHumMax("");
      setHumMin("");

      const msg = "Configuración enviada al ESP32 y guardada";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Éxito", msg);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "No se pudo aplicar la configuración";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={localStyles.pageContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={localStyles.tablesContainer}>
        {/* TABLA TEMPERATURA */}
        <View style={localStyles.cardSection}>
          <View
            style={[localStyles.cardHeader, { backgroundColor: "#2563eb" }]}
          >
            <Text style={localStyles.cardHeaderByText}>
              LÍMITES DE TEMPERATURA (°C)
            </Text>
          </View>
          <View style={localStyles.tableThRow}>
            <Text style={[localStyles.thText, { flex: 2 }]}>PARÁMETRO</Text>
            <Text
              style={[localStyles.thText, { flex: 1.5, textAlign: "center" }]}
            >
              VALOR ACT.
            </Text>
            <Text style={[localStyles.thText, { flex: 2, textAlign: "right" }]}>
              NUEVO VALOR
            </Text>
          </View>

          <View style={localStyles.tableRow}>
            <Text style={[localStyles.tdParam, { flex: 2 }]}>
              Máximo Crítico
            </Text>
            <Text style={[localStyles.tdValue, { flex: 1.5 }]}>
              {config.temp_max}°C
            </Text>
            <TextInput
              style={[globalStyles.inputText, localStyles.tableInput]}
              placeholder="Ej: 8.0"
              keyboardType="numeric"
              value={tempMax}
              onChangeText={setTempMax}
            />
          </View>
          <View style={[localStyles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[localStyles.tdParam, { flex: 2 }]}>
              Mínimo Crítico
            </Text>
            <Text style={[localStyles.tdValue, { flex: 1.5 }]}>
              {config.temp_min}°C
            </Text>
            <TextInput
              style={[globalStyles.inputText, localStyles.tableInput]}
              placeholder="Ej: 2.0"
              keyboardType="numeric"
              value={tempMin}
              onChangeText={setTempMin}
            />
          </View>
        </View>

        {/* TABLA VOLTAJE */}
        <View style={localStyles.cardSection}>
          <View
            style={[localStyles.cardHeader, { backgroundColor: "#f59e0b" }]}
          >
            <Text style={localStyles.cardHeaderByText}>
              LÍMITES DE VOLTAJE (V)
            </Text>
          </View>
          <View style={localStyles.tableThRow}>
            <Text style={[localStyles.thText, { flex: 2 }]}>PARÁMETRO</Text>
            <Text
              style={[localStyles.thText, { flex: 1.5, textAlign: "center" }]}
            >
              VALOR ACT.
            </Text>
            <Text style={[localStyles.thText, { flex: 2, textAlign: "right" }]}>
              NUEVO VALOR
            </Text>
          </View>

          <View style={localStyles.tableRow}>
            <Text style={[localStyles.tdParam, { flex: 2 }]}>Sobrevoltaje</Text>
            <Text style={[localStyles.tdValue, { flex: 1.5 }]}>
              {config.volt_max}V
            </Text>
            <TextInput
              style={[globalStyles.inputText, localStyles.tableInput]}
              placeholder="Ej: 135"
              keyboardType="numeric"
              value={voltMax}
              onChangeText={setVoltMax}
            />
          </View>
          <View style={[localStyles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[localStyles.tdParam, { flex: 2 }]}>Bajo Voltaje</Text>
            <Text style={[localStyles.tdValue, { flex: 1.5 }]}>
              {config.volt_min}V
            </Text>
            <TextInput
              style={[globalStyles.inputText, localStyles.tableInput]}
              placeholder="Ej: 100"
              keyboardType="numeric"
              value={voltMin}
              onChangeText={setVoltMin}
            />
          </View>
        </View>

        {/* TABLA HUMEDAD */}
        <View style={localStyles.cardSection}>
          <View
            style={[localStyles.cardHeader, { backgroundColor: "#059669" }]}
          >
            <Text style={localStyles.cardHeaderByText}>
              LÍMITES DE HUMEDAD (%)
            </Text>
          </View>
          <View style={localStyles.tableThRow}>
            <Text style={[localStyles.thText, { flex: 2 }]}>PARÁMETRO</Text>
            <Text
              style={[localStyles.thText, { flex: 1.5, textAlign: "center" }]}
            >
              VALOR ACT.
            </Text>
            <Text style={[localStyles.thText, { flex: 2, textAlign: "right" }]}>
              NUEVO VALOR
            </Text>
          </View>

          <View style={localStyles.tableRow}>
            <Text style={[localStyles.tdParam, { flex: 2 }]}>
              Humedad Máxima
            </Text>
            <Text style={[localStyles.tdValue, { flex: 1.5 }]}>
              {config.hum_max}%
            </Text>
            <TextInput
              style={[globalStyles.inputText, localStyles.tableInput]}
              placeholder="Ej: 90"
              keyboardType="numeric"
              value={humMax}
              onChangeText={setHumMax}
            />
          </View>
          <View style={[localStyles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[localStyles.tdParam, { flex: 2 }]}>
              Humedad Mínima
            </Text>
            <Text style={[localStyles.tdValue, { flex: 1.5 }]}>
              {config.hum_min}%
            </Text>
            <TextInput
              style={[globalStyles.inputText, localStyles.tableInput]}
              placeholder="Ej: 30"
              keyboardType="numeric"
              value={humMin}
              onChangeText={setHumMin}
            />
          </View>
        </View>
      </View>

      {/* Botón Guardar */}
      <View style={localStyles.buttonContainer}>
        <TouchableOpacity
          style={[globalStyles.btnSaveLarge, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={globalStyles.buttonText}>
            {saving ? "Guardando..." : "Aplicar Cambios Globales"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
