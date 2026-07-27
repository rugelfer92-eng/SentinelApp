import * as FileSystem from "expo-file-system";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../../src/api/apiConfig";
import { useAuth } from "../../src/auth/AuthContext";
import {
  getPendingSyncCount,
  getPendingSyncRecords,
  syncWithCloud,
} from "../../src/bluetooth/DataSync";
import s from "../../src/theme/auditoriaStyles";
import { colors } from "../../src/theme/globalStyles";

// ── Types ─────────────────────────────────────────────────────────
interface AuditoriaItem {
  _id: string;
  realizadoPor: { nombre?: string; role?: string };
  accion: string;
  entidad?: { tipo?: string; nombre?: string };
  detalle?: Record<string, any>;
  fecha: string;
}

interface SesionItem {
  _id: string;
  usuario: { nombre?: string; cedula?: string; role?: string };
  accion: "LOGIN" | "LOGOUT";
  ip?: string;
  fecha: string;
}

// ── Helpers ───────────────────────────────────────────────────────
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function ayer() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// AAAA-MM-DD
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ── Componente principal ──────────────────────────────────────────
export default function AuditoriaScreen() {
  const { user } = useAuth();

  const [fecha, setFecha] = useState(hoy());
  const [fechaInput, setFechaInput] = useState("");
  const [sesiones, setSesiones] = useState<SesionItem[]>([]);
  const [cambios, setCambios] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [pendingRecords, setPendingRecords] = useState<any[]>([]);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncingPending, setSyncingPending] = useState(false);
  const [pendingRecordsLoading, setPendingRecordsLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resSes, resCam] = await Promise.all([
        fetch(`${BASE_URL}/api/sesiones?fecha=${fecha}&limite=200`),
        fetch(`${BASE_URL}/api/auditoria?fecha=${fecha}&limite=200`),
      ]);
      const dataSes: SesionItem[] = resSes.ok ? await resSes.json() : [];
      const dataCam: AuditoriaItem[] = resCam.ok ? await resCam.json() : [];
      setSesiones(Array.isArray(dataSes) ? dataSes : []);
      setCambios(Array.isArray(dataCam) ? dataCam : []);
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    if (user?.role === "admin") {
      cargarDatos();
      actualizarPendientes();
    }
  }, [cargarDatos, user?.role]);

  const actualizarPendientes = async () => {
    const count = await getPendingSyncCount();
    setPendingSyncCount(count);
  };

  const openPendingModal = async () => {
    setPendingRecordsLoading(true);
    try {
      const records = await getPendingSyncRecords();
      setPendingRecords(records);
      setSyncModalVisible(true);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los registros pendientes.");
    } finally {
      setPendingRecordsLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <View style={s.accessDenied}>
        <Text style={s.lockIcon}>🔒</Text>
        <Text style={s.accessTitle}>Acceso Restringido</Text>
        <Text style={s.accessSub}>
          Solo los administradores pueden ver el módulo de auditoría.
        </Text>
      </View>
    );
  }

  if (user?.role !== "admin") {
    return (
      <View style={s.accessDenied}>
        <Text style={s.lockIcon}>🔒</Text>
        <Text style={s.accessTitle}>Acceso Restringido</Text>
        <Text style={s.accessSub}>
          Solo los administradores pueden ver el módulo de auditoría.
        </Text>
      </View>
    );
  }

  const hayRegistros = sesiones.length > 0 || cambios.length > 0;

  // ──────────────────────────────────────────────────────── Descarga PDF ────────────────────────────────────────────────────────
  const generarPDF = async (tipo: "todo" | "sensores" | "auditoria") => {
    const url = `${BASE_URL}/api/pdf/dia?fecha=${fecha}&tipo=${tipo}`;

    if (Platform.OS === "web") {
      setPdfLoading(true);
      try {
        window.open(url, "_blank");
      } finally {
        setPdfLoading(false);
      }
      return;
    }

    setPdfLoading(true);
    try {
      const fileName = `reporte-auditoria-${fecha}-${tipo}.pdf`;
      const downloadsDir = "/storage/emulated/0/Download/";
      const fileUri = `${downloadsDir}${fileName}`;

      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      if (downloadRes.status !== 200 && downloadRes.status !== 201) {
        throw new Error("No se pudo descargar el archivo PDF.");
      }

      const savedUri = downloadRes.uri || fileUri;
      try {
        const contentUri = await FileSystem.getContentUriAsync(savedUri);
        await Linking.openURL(contentUri);
      } catch {
        await Linking.openURL(savedUri);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message ||
          "No se pudo generar o abrir el PDF. Intenta nuevamente.",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────── Aplicar fecha escrita a mano ────────────────────────────────────────────────────────
  const aplicarFechaManual = () => {
    const limpio = fechaInput.trim();
    if (!FECHA_REGEX.test(limpio)) {
      const msg = "Usa el formato AAAA-MM-DD, por ejemplo 2026-06-21";
      if (Platform.OS === "web") {
        alert(msg);
      } else {
        Alert.alert("Fecha inválida", msg);
      }
      return;
    }
    setFecha(limpio);
    setFechaInput("");
  };

  const handleSyncPending = async () => {
    setSyncingPending(true);
    try {
      const synced = await syncWithCloud();
      await actualizarPendientes();
      if (synced > 0) {
        Alert.alert(
          "Sincronización",
          `Se cargaron ${synced} dato(s) al servidor.`,
        );
      } else {
        Alert.alert(
          "Sincronización",
          "No hay datos para subir o el servidor no respondió.",
        );
      }
    } catch {
      Alert.alert("Error", "No se pudo sincronizar los datos pendientes.");
    } finally {
      setSyncingPending(false);
    }
  };

  // ──────────────────────────────────────────────────────── Tab PDF ────────────────────────────────────────────────────────
  const TabPDF = () => (
    <>
      <Modal
        visible={syncModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSyncModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Registros pendientes</Text>
            {pendingRecordsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : pendingRecords.length === 0 ? (
              <Text style={s.modalText}>No hay registros pendientes.</Text>
            ) : (
              <ScrollView style={s.modalList}>
                {pendingRecords.map((record) => (
                  <View key={record.id} style={s.modalItem}>
                    <Text style={s.modalItemText}>
                      #{record.id} • T: {record.temperatura} • V:{" "}
                      {record.voltaje} • H: {record.humedad}
                    </Text>
                    <Text style={s.modalItemDate}>{record.fecha}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonCancel]}
                onPress={() => setSyncModalVisible(false)}
                disabled={syncingPending}
              >
                <Text style={s.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonConfirm]}
                onPress={handleSyncPending}
                disabled={syncingPending || pendingRecords.length === 0}
              >
                <Text style={s.modalButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={s.pdfContainer}>
        <View style={s.pdfCard}>
          <Text style={s.pdfIcon}>📄</Text>
          <Text style={s.pdfTitle}>Generar Reporte PDF</Text>
          <Text style={s.pdfSub}>
            Fecha seleccionada:{" "}
            <Text style={{ fontWeight: "700", color: colors.primary }}>
              {fecha}
            </Text>
          </Text>
          <Text style={s.pdfDesc}>
            El reporte incluye historial de sensores, sesiones de usuarios y
            cambios del sistema en un documento profesional listo para imprimir
            o archivar.
          </Text>
        </View>

        {[
          {
            tipo: "todo" as const,
            icon: "📊",
            label: "Reporte Completo",
            sub: "Sensores + Sesiones + Cambios",
            color: "#1e3a8a",
          },
          {
            tipo: "sensores" as const,
            icon: "🌡️",
            label: "Solo Sensores",
            sub: "Historial de temperatura, voltaje y humedad",
            color: "#0369a1",
          },
          {
            tipo: "auditoria" as const,
            icon: "🔐",
            label: "Auditoría y Sesiones",
            sub: "Accesos y cambios del sistema",
            color: "#7c3aed",
          },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.tipo}
            style={[s.pdfOption, { borderLeftColor: opt.color }]}
            onPress={() => generarPDF(opt.tipo)}
            disabled={pdfLoading}
          >
            <Text style={s.pdfOptionIcon}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.pdfOptionLabel, { color: opt.color }]}>
                {opt.label}
              </Text>
              <Text style={s.pdfOptionSub}>{opt.sub}</Text>
            </View>
            {pdfLoading ? (
              <ActivityIndicator size="small" color={opt.color} />
            ) : (
              <Text style={[s.pdfArrow, { color: opt.color }]}>↗</Text>
            )}
          </TouchableOpacity>
        ))}

        <Text style={s.pdfNote}>
          💡 En Android/iOS el enlace al PDF se mostrará para abrir en el
          navegador. En web el archivo se descarga directamente.
        </Text>
      </ScrollView>
    </>
  );

  // ──────────────────────────────────────────────────────── Render principal ────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* SELECTOR DE FECHA: Hoy / Ayer */}
      <View style={s.dateRow}>
        <TouchableOpacity
          style={[s.dateChip, fecha === hoy() && s.dateChipActive]}
          onPress={() => setFecha(hoy())}
        >
          <Text
            style={[s.dateChipText, fecha === hoy() && s.dateChipTextActive]}
          >
            Hoy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.dateChip, fecha === ayer() && s.dateChipActive]}
          onPress={() => setFecha(ayer())}
        >
          <Text
            style={[s.dateChipText, fecha === ayer() && s.dateChipTextActive]}
          >
            Ayer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            s.dateChip,
            pendingSyncCount > 0 && s.syncChip,
            pendingSyncCount === 0 && s.syncChipDisabled,
          ]}
          onPress={openPendingModal}
          disabled={pendingSyncCount === 0 || syncingPending}
        >
          <Text
            style={[
              s.dateChipText,
              pendingSyncCount > 0 && s.syncChipText,
              pendingSyncCount === 0 && s.syncChipTextDisabled,
            ]}
          >
            {syncingPending
              ? "Sincronizando..."
              : `Subir ${pendingSyncCount} registros a mongoDB`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Insertar fecha manual (antes era el rectángulo amarillo) ── */}
      <View style={s.customDateRow}>
        <TextInput
          style={s.dateInput}
          placeholder="AAAA-MM-DD"
          placeholderTextColor="#94a3b8"
          value={fechaInput}
          onChangeText={setFechaInput}
          onSubmitEditing={aplicarFechaManual}
          autoCapitalize="none"
        />
        <TouchableOpacity style={s.dateGoBtn} onPress={aplicarFechaManual}>
          <Text style={s.dateGoBtnText}>IR</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.dateBadgeText}>Fecha seleccionada: {fecha}</Text>

      {/* CONTENIDO */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Cargando registros...</Text>
        </View>
      ) : !hayRegistros ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>🗂️</Text>
          <Text style={s.emptyText}>No hay registros este día.</Text>
        </View>
      ) : (
        <TabPDF />
      )}
    </View>
  );
}
