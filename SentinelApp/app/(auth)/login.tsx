import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [tipoDocumento, setTipoDocumento] = useState<"V" | "E" | "J">("V");
  const [documentTypePickerVisible, setDocumentTypePickerVisible] =
    useState(false);
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const rawNumero = cedula.trim().replace(/[^0-9]/g, "");
    if (!rawNumero || !password.trim()) {
      const msg = "Ingresa tu tipo de documento, cédula y contraseña";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Atención", msg);
      return;
    }

    const cedulaCompleta = `${tipoDocumento}-${rawNumero}`;

    setLoading(true);
    const result = await login(cedulaCompleta, password);
    setLoading(false);

    if (!result.success) {
      Platform.OS === "web"
        ? alert(result.message)
        : Alert.alert("Error", result.message);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "android" ? "height" : undefined}
    >
      <View style={s.topBlob} />
      <View style={s.bottomBlob} />

      <View style={s.card}>
        <View style={s.iconWrap}>
          <Text style={s.iconText}>❄️</Text>
        </View>

        <Text style={s.brand}>Sentinel Cold</Text>
        <Text style={s.sub}>Sistema de Control Frigorifico</Text>

        <View style={s.divider} />

        <Text style={s.label}>Documento de Identidad</Text>
        <View style={s.documentRow}>
          <TouchableOpacity
            style={[s.input, s.documentTypeButton]}
            onPress={() => setDocumentTypePickerVisible(true)}
          >
            <Text style={s.documentTypeText}>{tipoDocumento}</Text>
          </TouchableOpacity>
          <TextInput
            style={[s.input, s.documentInput]}
            placeholder="Ej: 12345678"
            placeholderTextColor="#94a3b8"
            value={cedula}
            onChangeText={(text) => setCedula(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            autoCapitalize="none"
          />
        </View>

        <Modal
          visible={documentTypePickerVisible}
          transparent
          animationType="fade"
        >
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Selecciona tipo de documento</Text>
              {(["V", "E", "J"] as const).map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => {
                    setTipoDocumento(tipo);
                    setDocumentTypePickerVisible(false);
                  }}
                  style={[
                    s.modalOption,
                    tipoDocumento === tipo && s.modalOptionSelected,
                  ]}
                >
                  <Text style={s.modalOptionText}>{tipo}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setDocumentTypePickerVisible(false)}
                style={s.modalCancel}
              >
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={s.label}>Contraseña</Text>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>INGRESAR AL SISTEMA</Text>
          )}
        </TouchableOpacity>

        <Text style={s.hint}>
          Contacta al administrador si no tienes acceso
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
  },
  // Blobs decorativos de fondo
  topBlob: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
  },
  bottomBlob: {
    position: "absolute",
    bottom: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(16, 185, 129, 0.10)",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 32,
    width: "90%",
    maxWidth: 380,
    // Sombra
    elevation: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },

  iconWrap: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconText: { fontSize: 36 },

  brand: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
    color: "#1e3a8a",
    letterSpacing: 0.5,
  },
  sub: {
    textAlign: "center",
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    letterSpacing: 0.3,
  },

  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  documentTypeButton: {
    flex: 0.28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingVertical: 13,
    marginRight: 8,
  },
  documentTypeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  documentInput: {
    flex: 0.72,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
    color: "#1e293b",
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 10,
  },
  modalOptionSelected: {
    backgroundColor: "#eef2ff",
  },
  modalOptionText: {
    fontWeight: "700",
    color: "#1e293b",
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
  },
  modalCancelText: {
    fontWeight: "700",
    color: "#1e293b",
  },

  btn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },

  hint: {
    textAlign: "center",
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 20,
  },
});
