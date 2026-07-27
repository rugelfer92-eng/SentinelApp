import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#f8fafc", // Fondo Slate sutil idéntico a configuración
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    gap: 20, // Espaciado simétrico entre tarjetas
  },
  cardSection: {
    backgroundColor: "#ffffff",
    borderRadius: 20, // Bordes planos estilizados
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  cardBody: {
    padding: 16,
  },
  valueSubtext: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
  },
  valueText: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  rangeBadge: {
    backgroundColor: "#f8fafc",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  rangeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  alertBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  controlButton: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  controlButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
});
