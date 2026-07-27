import { StyleSheet } from "react-native";

export const localStyles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#f8fafc", // Fondo Slate sutil
    padding: 20,
  },
  headerSection: {
    marginBottom: 24,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a", // Slate muy oscuro
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  tablesContainer: {
    gap: 20, // Espaciado simétrico entre las secciones/tarjetas
  },
  cardSection: {
    backgroundColor: "#ffffff",
    borderRadius: 20, // Bordes estilizados planos
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardHeaderByText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  tableThRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  thText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  tdParam: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  tdValue: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  tableInput: {
    flex: 2,
    height: 38,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    textAlign: "right",
    marginTop: 0,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 40,
  },
  restrictedContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  restrictedSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
});
