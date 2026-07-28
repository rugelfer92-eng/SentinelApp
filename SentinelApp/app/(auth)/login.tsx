import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { loginStyles } from "../../src/theme/loginStyles";

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
      if (Platform.OS === "web") {
        alert(msg);
      } else {
        Alert.alert("Atención", msg);
      }
      return;
    }

    const cedulaCompleta = `${tipoDocumento}-${rawNumero}`;

    setLoading(true);
    const result = await login(cedulaCompleta, password);
    setLoading(false);

    if (!result.success) {
      if (Platform.OS === "web") {
        alert(result.message);
      } else {
        Alert.alert("Error", result.message);
      }
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
      style={loginStyles.root}
      behavior={Platform.OS === "android" ? "height" : undefined}
    >
      <View style={loginStyles.topBlob} />
      <View style={loginStyles.bottomBlob} />

      <View style={loginStyles.card}>
        <View style={loginStyles.iconWrap}>
          <Text style={loginStyles.iconText}>❄️</Text>
        </View>

        <Text style={loginStyles.brand}>Sentinel Cold</Text>
        <Text style={loginStyles.sub}>Sistema de Control Frigorifico</Text>

        <View style={loginStyles.divider} />

        <Text style={loginStyles.label}>Documento de Identidad</Text>
        <View style={loginStyles.documentRow}>
          <TouchableOpacity
            style={[loginStyles.input, loginStyles.documentTypeButton]}
            onPress={() => setDocumentTypePickerVisible(true)}
          >
            <Text style={loginStyles.documentTypeText}>{tipoDocumento}</Text>
          </TouchableOpacity>
          <TextInput
            style={[loginStyles.input, loginStyles.documentInput]}
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
          <View style={loginStyles.modalOverlay}>
            <View style={loginStyles.modalContent}>
              <Text style={loginStyles.modalTitle}>Selecciona tipo de documento</Text>
              {(["V", "E", "J"] as const).map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => {
                    setTipoDocumento(tipo);
                    setDocumentTypePickerVisible(false);
                  }}
                  style={[
                    loginStyles.modalOption,
                    tipoDocumento === tipo && loginStyles.modalOptionSelected,
                  ]}
                >
                  <Text style={loginStyles.modalOptionText}>{tipo}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setDocumentTypePickerVisible(false)}
                style={loginStyles.modalCancel}
              >
                <Text style={loginStyles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={loginStyles.label}>Contraseña</Text>
        <TextInput
          style={loginStyles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[loginStyles.btn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={loginStyles.btnText}>INGRESAR AL SISTEMA</Text>
          )}
        </TouchableOpacity>

        <Text style={loginStyles.hint}>
          Contacta al administrador si no tienes acceso
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
