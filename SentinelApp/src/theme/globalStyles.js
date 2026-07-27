import { StyleSheet } from "react-native";

export const colors = {
  // Colores principales
  primary: "#2563eb",
  secondary: "#10b981",
  background: "#f1f5f9",
  bgSubTitle: "#a7d0f8",

  // Estados de alerta
  success: "#2e7d32",
  error: "#d32f2f",
  warning: "#fbc02d",

  // Texto
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  white: "#FFFFFF",
};

export const styles = StyleSheet.create({
  containerWhite: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  contentPadding: {
    padding: 20,
  },

  // Encabezado
  headerBlue: {
    margin: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  ContenedorBody: {
    backgroundColor: colors.bgSubTitle,
    borderRadius: 15,
    padding: 10,
    margin: 10,
  },
  SubTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.bgSubTitle,
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 10,
    elevation: 2,
  },

  // Textos del header
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  headerTitle2: {
    color: "#1a1a1f",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Estado On/Off
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    marginTop: 7,
    marginBottom: 7,
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 5,
  },
  value: {
    fontSize: 40,
    fontWeight: "bold",
    color: colors.textPrimary,
  },

  // Textos
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 20,
    fontStyle: "italic",
  },

  // Botones e Inputs
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
  },
  inputText: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#d1d1d1",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tableHistorial: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    minWidth: 420,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  filaHistorial: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 15,
    alignItems: "center",
  },
  celdaTexto: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#1e293b",
  },
  celdaHeader: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    color: "#475569",
    textTransform: "uppercase",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCard: {
    padding: 12,
    alignItems: "center",
  },
  headerCardText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputConfig: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    textAlign: "center",
    color: "#1e293b",
    width: 80,
  },
  btnSaveLarge: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  syncBadge: {
    backgroundColor: "#fef3c7",
    padding: 5,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  syncText: {
    color: "#b45309",
    fontSize: 10,
    fontWeight: "bold",
  },
});
