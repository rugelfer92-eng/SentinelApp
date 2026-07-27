import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createEmpleado,
  deleteEmpleado,
  Empleado,
  getEmpleados,
  updateEmpleado,
} from "../../src/api/empleadoService";
import { useAuth, UserRole } from "../../src/auth/AuthContext";
import { colors, styles } from "../../src/theme/globalStyles";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ── Información visual de cada rol ──────────────────────────────────
const ROLES_INFO: Record<UserRole, { label: string; color: string }> = {
  admin: { label: "Admin", color: "#7c3aed" },
  editor: { label: "cliente", color: "#2563eb" },
  viewer: { label: "observador", color: "#64748b" },
};

// ── Roles que cada nivel puede ASIGNAR ──────────────────────────────
const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  admin: ["admin", "editor", "viewer"],
  editor: ["viewer"],
  viewer: [],
};

const PHONE_COUNTRIES = [
  { label: "Venezuela", code: "+58", iso: "VE" },
  { label: "Estados Unidos", code: "+1", iso: "US" },
  { label: "Colombia", code: "+57", iso: "CO" },
  { label: "Perú", code: "+51", iso: "PE" },
  { label: "México", code: "+52", iso: "MX" },
  { label: "Chile", code: "+56", iso: "CL" },
  { label: "Argentina", code: "+54", iso: "AR" },
  { label: "Brasil", code: "+55", iso: "BR" },
  { label: "Ecuador", code: "+593", iso: "EC" },
  { label: "Panamá", code: "+507", iso: "PA" },
  { label: "Uruguay", code: "+598", iso: "UY" },
  { label: "España", code: "+34", iso: "ES" },
  { label: "Estados Unidos (Puerto Rico)", code: "+1", iso: "PR" },
  { label: "Costa Rica", code: "+506", iso: "CR" },
  { label: "Guatemala", code: "+502", iso: "GT" },
  { label: "Honduras", code: "+504", iso: "HN" },
  { label: "Nicaragua", code: "+505", iso: "NI" },
  { label: "El Salvador", code: "+503", iso: "SV" },
  { label: "República Dominicana", code: "+1", iso: "DO" },
  { label: "Canadá", code: "+1", iso: "CA" },
];

export default function EmpleadosScreen() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Empleado | null>(null);

  const { user, canManageRole } = useAuth();

  // Campos del formulario
  const [tipoDocumento, setTipoDocumento] = useState<"V" | "E" | "J">("V");
  const [documentTypePickerVisible, setDocumentTypePickerVisible] =
    useState(false);
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [countryCode, setCountryCode] = useState("+58");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [cargo, setCargo] = useState("");
  const [dias, setDias] = useState<string[]>([]);
  const [turno, setTurno] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  const assignableRoles: UserRole[] = ASSIGNABLE_ROLES[user?.role ?? "viewer"];
  const visibleRoles: UserRole[] = assignableRoles.filter((r) =>
    canManageRole(r),
  );

  const normalizeTelefono = (country: string, phone: string) => {
    const code = country.trim().replace(/[^0-9]/g, "");
    if (!code) return null;

    let digits = phone.trim().replace(/[^0-9]/g, "");
    if (!digits) return null;
    if (digits.startsWith(code)) {
      digits = digits.slice(code.length);
    }
    digits = digits.replace(/^0+/, "");
    if (digits.length < 7 || digits.length > 15) return null;

    return `+${code}${digits}`;
  };

  const parseCedula = (value: string) => {
    const raw = value.trim().toUpperCase();
    const match = raw.match(/^([VEJ])[-\s]?(\d{1,10})$/);
    return match
      ? { tipo: match[1] as "V" | "E" | "J", numero: match[2] }
      : null;
  };

  // ── Cargar empleados ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmpleados(user?.role ?? "viewer");
      setEmpleados(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Resetear formulario ──────────────────────────────────────────
  const resetForm = () => {
    setEditingItem(null);
    setTipoDocumento("V");
    setNumeroDocumento("");
    setNombre("");
    setTelefono("");
    setCargo("");
    setDias([]);
    setTurno("");
    setPassword("");
    setRole("viewer");
  };

  // ── Abrir modal de edición ───────────────────────────────────────
  const openEdit = (item: Empleado) => {
    setEditingItem(item);
    const parsed = parseCedula(item.cedula ?? "");
    setTipoDocumento(parsed?.tipo ?? "V");
    setNumeroDocumento(parsed?.numero ?? "");
    setNombre(item.nombreApellido);
    setTelefono(item.telefono ?? "");
    setCargo(item.cargo ?? "");
    setDias(item.diasLaborales ?? []);
    setTurno(item.turno ?? "");
    setRole((item.role as UserRole) ?? "viewer");
    setPassword("");
    setModalVisible(true);
  };

  // ── Guardar (crear o editar) ─────────────────────────────────────
  const handleSave = async () => {
    if (!numeroDocumento.trim() || !nombre.trim()) {
      return Alert.alert("Atención", "Documento y Nombre son obligatorios");
    }

    const cleanedNumero = numeroDocumento.trim().replace(/[^0-9]/g, "");
    if (cleanedNumero.length === 0 || cleanedNumero.length > 10) {
      return Alert.alert(
        "Atención",
        "Número de documento inválido. Debe tener hasta 10 dígitos.",
      );
    }

    const normalizedCedula = `${tipoDocumento}-${cleanedNumero}`;
    const normalizedTelefono = normalizeTelefono(countryCode, telefono);
    if (!normalizedTelefono) {
      return Alert.alert(
        "Atención",
        "Teléfono inválido. Ingresa el código de país y el número sin 0 inicial, por ejemplo +58 y 4247756386.",
      );
    }

    if (!canManageRole(role)) {
      return Alert.alert(
        "Sin permiso",
        "No puedes asignar ese nivel de acceso",
      );
    }
    if (!editingItem && !password.trim()) {
      return Alert.alert(
        "Atención",
        "Debes asignar una contraseña al nuevo usuario",
      );
    }

    const payload: any = {
      cedula: normalizedCedula,
      nombreApellido: nombre.trim(),
      telefono: normalizedTelefono,
      cargo,
      diasLaborales: dias,
      turno,
      role,
      _auditUser: {
        id: user?._id,
        nombre: user?.nombreApellido,
        role: user?.role,
      },
    };
    if (password.trim()) payload.password = password;

    try {
      if (editingItem?._id) {
        await updateEmpleado(editingItem._id, payload);
      } else {
        await createEmpleado(payload);
      }
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo guardar la información.");
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────
  const handleDelete = (item: Empleado) => {
    const itemRole = (item.role as UserRole) ?? "viewer";
    if (!canManageRole(itemRole)) {
      return Alert.alert("Sin permiso", "No puedes eliminar a este usuario");
    }
    Alert.alert("Eliminar", `¿Borrar a ${item.nombreApellido}?`, [
      { text: "No" },
      {
        text: "Sí",
        style: "destructive",
        onPress: async () => {
          await deleteEmpleado(
            item._id!,
            user?._id ?? "",
            user?.nombreApellido ?? "",
            user?.role ?? "viewer",
          );
          loadData();
        },
      },
    ]);
  };

  const myBadge = ROLES_INFO[user?.role ?? "viewer"];

  return (
    <View style={styles.containerWhite}>
      {/* SUBTÍTULO */}
      <View style={styles.SubTitle}>
        <View>
          <Text style={styles.headerTitle2}>Personal</Text>
          <View
            style={{
              backgroundColor: myBadge.color + "22",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
              marginTop: 2,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{ fontSize: 10, fontWeight: "bold", color: myBadge.color }}
            >
              {myBadge.label}
            </Text>
          </View>
        </View>

        {visibleRoles.length > 0 && (
          <TouchableOpacity
            style={[
              styles.statusContainer,
              { backgroundColor: colors.primary, paddingHorizontal: 15 },
            ]}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            <Text style={styles.statusText}>+ AGREGAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA */}
      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={empleados}
            keyExtractor={(item) => item._id ?? Math.random().toString()}
            renderItem={({ item }) => {
              const itemRole = (item.role as UserRole) ?? "viewer";
              const itemBadge = ROLES_INFO[itemRole];
              const puedeGestionar = canManageRole(itemRole);

              return (
                <View style={styles.card}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      {/* Cédula + badge */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 2,
                        }}
                      >
                        <Text style={styles.label}>C.I. {item.cedula}</Text>
                        <View
                          style={{
                            backgroundColor: itemBadge.color + "22",
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: "bold",
                              color: itemBadge.color,
                            }}
                          >
                            {itemBadge.label}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.title,
                          { fontSize: 17, marginBottom: 2 },
                        ]}
                      >
                        {item.nombreApellido}
                      </Text>
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 13 }}
                      >
                        {item.cargo ?? "Sin cargo"} •{" "}
                        {item.turno ?? "Sin turno"}
                      </Text>

                      {/* Tags días */}
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          marginTop: 8,
                        }}
                      >
                        {item.diasLaborales?.map((d) => (
                          <View
                            key={d}
                            style={{
                              backgroundColor: "#f1f5f9",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              marginRight: 5,
                              marginBottom: 5,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                color: colors.primary,
                                fontWeight: "bold",
                              }}
                            >
                              {d}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Acciones */}
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "flex-end",
                        gap: 10,
                      }}
                    >
                      {puedeGestionar && (
                        <TouchableOpacity onPress={() => openEdit(item)}>
                          <Text
                            style={{
                              color: colors.primary,
                              fontWeight: "bold",
                            }}
                          >
                            Editar
                          </Text>
                        </TouchableOpacity>
                      )}
                      {puedeGestionar && (
                        <TouchableOpacity onPress={() => handleDelete(item)}>
                          <Text
                            style={{ color: colors.error, fontWeight: "bold" }}
                          >
                            Borrar
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 50,
                  color: colors.textSecondary,
                }}
              >
                No hay personal registrado.
              </Text>
            }
          />
        )}
      </View>

      {/* MODAL FORMULARIO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              margin: 20,
              padding: 20,
              borderRadius: 20,
              maxHeight: "92%",
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={[
                  styles.title,
                  { color: colors.primary, marginBottom: 20 },
                ]}
              >
                {editingItem ? "Editar Personal" : "Nuevo Ingreso"}
              </Text>

              <Text style={styles.inputLabel}>Documento de Identidad</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setDocumentTypePickerVisible(true)}
                  style={[styles.input, { flex: 0.35, marginRight: 8 }]}
                >
                  <Text style={{ fontWeight: "bold", color: "#475569" }}>
                    {tipoDocumento}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  placeholder="Número de documento"
                  style={[styles.input, { flex: 0.65 }]}
                  value={numeroDocumento}
                  onChangeText={(text) =>
                    setNumeroDocumento(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <Modal
                visible={documentTypePickerVisible}
                transparent
                animationType="fade"
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    justifyContent: "center",
                    padding: 20,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        marginBottom: 12,
                      }}
                    >
                      Selecciona documento
                    </Text>
                    {(["V", "E", "J"] as const).map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        onPress={() => {
                          setTipoDocumento(tipo);
                          setDocumentTypePickerVisible(false);
                        }}
                        style={{
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          marginBottom: 10,
                          backgroundColor:
                            tipoDocumento === tipo ? "#eef2ff" : "#f8fafc",
                        }}
                      >
                        <Text style={{ fontWeight: "700" }}>{tipo}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setDocumentTypePickerVisible(false)}
                      style={{
                        marginTop: 8,
                        paddingVertical: 14,
                        borderRadius: 12,
                        backgroundColor: "#e2e8f0",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "700" }}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <Text style={styles.inputLabel}>Nombre y Apellido</Text>
              <TextInput
                placeholder="Nombre y Apellido"
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
              />

              <Text style={styles.inputLabel}>Teléfono</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setCountryPickerVisible(true)}
                  style={[styles.input, { flex: 0.35, marginRight: 8 }]}
                >
                  <Text style={{ fontWeight: "bold", color: "#475569" }}>
                    {countryCode}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  placeholder="Ej. 4247756386"
                  style={[styles.input, { flex: 0.72 }]}
                  value={telefono}
                  onChangeText={(text) =>
                    setTelefono(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="phone-pad"
                />
              </View>
              <Modal
                visible={countryPickerVisible}
                transparent
                animationType="fade"
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    justifyContent: "center",
                    padding: 20,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 16,
                      maxHeight: "75%",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        marginBottom: 12,
                      }}
                    >
                      Selecciona país
                    </Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {PHONE_COUNTRIES.map((country) => (
                        <TouchableOpacity
                          key={`${country.iso}-${country.code}`}
                          onPress={() => {
                            setCountryCode(country.code);
                            setCountryPickerVisible(false);
                          }}
                          style={{
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            marginBottom: 10,
                            backgroundColor:
                              countryCode === country.code
                                ? "#eef2ff"
                                : "#f8fafc",
                          }}
                        >
                          <Text style={{ fontWeight: "700" }}>
                            {country.label} ({country.code})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity
                      onPress={() => setCountryPickerVisible(false)}
                      style={{
                        marginTop: 8,
                        paddingVertical: 14,
                        borderRadius: 12,
                        backgroundColor: "#e2e8f0",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "700" }}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              <View style={{ width: "100%" }}>
                <Text style={styles.inputLabel}>Cargo</Text>
                <TextInput
                  placeholder="Cargo"
                  style={styles.input}
                  value={cargo}
                  onChangeText={setCargo}
                />
              </View>

              <Text style={styles.inputLabel}>Horario / Turno</Text>
              <TextInput
                placeholder="Horario/Turno"
                style={styles.input}
                value={turno}
                onChangeText={setTurno}
              />

              {/* Contraseña */}
              <Text style={[styles.inputLabel, { color: "#7c3aed" }]}>
                Contraseña {editingItem ? "(vacío = sin cambios)" : "*"}
              </Text>
              <TextInput
                placeholder="Nueva contraseña"
                style={[styles.input, { borderColor: "#7c3aed" }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Nivel de acceso */}
              <Text style={[styles.inputLabel, { color: "#7c3aed" }]}>
                Nivel de Acceso
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                {visibleRoles.map((r) => {
                  const info = ROLES_INFO[r];
                  const selected = role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={{
                        flex: 1,
                        minWidth: 80,
                        padding: 10,
                        borderRadius: 10,
                        alignItems: "center",
                        backgroundColor: selected ? info.color : "#f1f5f9",
                        borderWidth: 1.5,
                        borderColor: selected ? info.color : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "bold",
                          color: selected ? "#fff" : "#475569",
                        }}
                      >
                        {info.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Días de trabajo */}
              <Text style={styles.inputLabel}>Días de Trabajo</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {DIAS_SEMANA.map((dia) => {
                  const sel = dias.includes(dia);
                  return (
                    <TouchableOpacity
                      key={dia}
                      onPress={() =>
                        setDias((prev) =>
                          sel ? prev.filter((d) => d !== dia) : [...prev, dia],
                        )
                      }
                      style={{
                        width: "23%",
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 10,
                        alignItems: "center",
                        backgroundColor: sel ? colors.primary : "#f1f5f9",
                      }}
                    >
                      <Text
                        style={{
                          color: sel ? "#fff" : "#475569",
                          fontWeight: "bold",
                          fontSize: 12,
                        }}
                      >
                        {dia}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Leyenda */}
              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  NIVELES DE ACCESO
                </Text>
                <Text style={{ fontSize: 11, color: "#1d173f" }}>
                  Administrador — Gestiona todos + I/H/P/C/A
                </Text>
                <Text style={{ fontSize: 11, color: "#1d173f", marginTop: 2 }}>
                  Cliente — Gestiona observadores + I/H/P/C
                </Text>
                <Text style={{ fontSize: 11, color: "#1d173f", marginTop: 2 }}>
                  Observador — Solo I/H
                </Text>
              </View>

              {/* Botones */}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 10,
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  style={{ flex: 1, padding: 15, alignItems: "center" }}
                >
                  <Text style={{ color: colors.error, fontWeight: "bold" }}>
                    CANCELAR
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.button, { flex: 1.5 }]}
                >
                  <Text style={styles.buttonText}>GUARDAR</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
