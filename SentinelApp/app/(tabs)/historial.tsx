import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getHistorialPorHora, SensorData } from "../../src/api/sensorService";
import { useRelayControl } from "../../src/hooks/useRelayControl";
import { colors, styles } from "../../src/theme/globalStyles";

const HORAS_12 = Array.from({ length: 12 }, (_, i) =>
  (i === 0 ? 12 : i).toString().padStart(2, "0"),
);
const MINUTOS = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const PERIODOS = ["AM", "PM"];

export default function HistorialScreen() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [resultados, setResultados] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);
  const { isRelayOn, toggleRelay, isChanging } = useRelayControl();

  // Estados para el scroll en Web (Formato 12h)
  const [webHour, setWebHour] = useState("12");
  const [webMinute, setWebMinute] = useState("00");
  const [webPeriod, setWebPeriod] = useState("AM");

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);
      consultarVentana(selectedDate);
    }
  };

  const consultarVentana = async (fechaABuscar: Date) => {
    const horas = fechaABuscar.getHours().toString().padStart(2, "0");
    const minutos = fechaABuscar.getMinutes().toString().padStart(2, "0");
    const horaBusqueda = `${horas}:${minutos}`;

    try {
      setLoading(true);
      const data = await getHistorialPorHora(horaBusqueda);
      setResultados(data && data.length > 0 ? data : []);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarBusquedaWeb = () => {
    let h24 = parseInt(webHour);
    if (webPeriod === "PM" && h24 < 12) h24 += 12;
    if (webPeriod === "AM" && h24 === 12) h24 = 0;

    const nuevaFecha = new Date();
    nuevaFecha.setHours(h24, parseInt(webMinute));
    setDate(nuevaFecha);
    setShowPicker(false);
    consultarVentana(nuevaFecha);
  };

  return (
    <View style={styles.containerWhite}>
      {/* SubTitle */}
      <View style={styles.SubTitle}>
        <Text style={styles.headerTitle2}>Historial</Text>
        <TouchableOpacity
          style={[
            styles.statusContainer,
            { backgroundColor: colors.primary, paddingHorizontal: 20 },
          ]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.statusText}>BUSCAR HORA</Text>
        </TouchableOpacity>
      </View>

      {/* 1. RELOJ NATIVO (Android) */}
      {showPicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={onChange}
        />
      )}

      {/* 2. RELOJ SCROLL 12H (Web) */}
      <Modal
        visible={showPicker && Platform.OS === "web"}
        transparent
        animationType="fade"
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.scrollPickerContainer}>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginBottom: 15,
                textAlign: "center",
                color: colors.primary,
              }}
            >
              Seleccionar Hora (12h)
            </Text>

            <View
              style={{
                flexDirection: "row",
                height: 180,
                justifyContent: "center",
              }}
            >
              <View style={localStyles.scrollCol}>
                <FlatList
                  data={HORAS_12}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setWebHour(item)}>
                      <Text
                        style={[
                          localStyles.scrollItem,
                          webHour === item && localStyles.activeItem,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              <Text style={localStyles.separator}>:</Text>

              <View style={localStyles.scrollCol}>
                <FlatList
                  data={MINUTOS}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setWebMinute(item)}>
                      <Text
                        style={[
                          localStyles.scrollItem,
                          webMinute === item && localStyles.activeItem,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              <View style={[localStyles.scrollCol, { marginLeft: 10 }]}>
                {PERIODOS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setWebPeriod(p)}
                    style={{ marginVertical: 10 }}
                  >
                    <Text
                      style={[
                        localStyles.scrollItem,
                        webPeriod === p && localStyles.activeItem,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 25 }}>
              <TouchableOpacity
                style={[localStyles.webBtn, { backgroundColor: "#f1f5f9" }]}
                onPress={() => setShowPicker(false)}
              >
                <Text style={{ color: "#64748b" }}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localStyles.webBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={confirmarBusquedaWeb}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  BUSCAR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tabla de Resultados */}
      <ScrollView style={{ flex: 1, padding: 20, alignContent: "center" }}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={localStyles.table}>
              {/* Header de la tabla */}
              <View
                style={[
                  localStyles.row,
                  {
                    backgroundColor: "#f8fafc",
                    borderTopLeftRadius: 15,
                    borderTopRightRadius: 15,
                  },
                ]}
              >
                <Text style={localStyles.headerCell}>Hora</Text>
                <Text style={localStyles.headerCell}>Temp</Text>
                <Text style={localStyles.headerCell}>Voltaje</Text>
                <Text style={localStyles.headerCell}>Humedad</Text>
              </View>

              {/* Mapeo de resultados */}
              {resultados.map((item, index) => (
                <View
                  key={index}
                  style={[
                    localStyles.row,
                    index === resultados.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={localStyles.cell}>
                    {new Date(item.fecha).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                  <Text style={[localStyles.cell, { color: "#2138c0" }]}>
                    {item.temperatura?.toFixed(1)}°C
                  </Text>
                  <Text style={[localStyles.cell, { color: "#b45309" }]}>
                    {item.voltaje}V
                  </Text>
                  <Text style={[localStyles.cell, { color: "#059669" }]}>
                    {item.humedad?.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollPickerContainer: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 25,
    width: 320,
    elevation: 20,
  },
  scrollCol: { width: 70, alignItems: "center" },
  scrollItem: {
    fontSize: 18,
    padding: 8,
    color: "#cbd5e1",
    textAlign: "center",
  },
  activeItem: {
    color: colors.primary,
    fontWeight: "bold",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  separator: {
    fontSize: 24,
    fontWeight: "bold",
    alignSelf: "center",
    color: "#cbd5e1",
  },
  webBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: "center" },

  // Tabla con fondo blanco
  table: {
    backgroundColor: "#FFFFFF", // Fondo blanco solicitado
    borderRadius: 15,
    minWidth: 420,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 15,
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    color: "#64748b",
  },
  cell: { flex: 1, textAlign: "center", fontSize: 13, color: "#1e293b" },
});
