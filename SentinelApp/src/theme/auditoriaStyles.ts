import { StyleSheet } from "react-native";
import { colors } from "./globalStyles";

export default StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },

  // Access denied
  accessDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  lockIcon: { fontSize: 56, marginBottom: 16 },
  accessTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  accessSub: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },

  // Fecha — Hoy / Ayer
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  dateChipActive: { backgroundColor: colors.primary },
  dateChipText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  dateChipTextActive: { color: "#fff" },
  syncChip: {
    backgroundColor: "#fde047",
  },
  syncChipDisabled: {
    backgroundColor: "#e2e8f0",
  },
  syncChipText: {
    color: "#1f2937",
  },
  syncChipTextDisabled: {
    color: "#94a3b8",
  },

  // Fecha manual
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1e293b",
  },
  dateGoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  dateGoBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  dateBadgeText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },

  // Loading / empty
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#64748b", fontSize: 14 },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: "#94a3b8", fontSize: 14 },

  // PDF / modal
  pdfContainer: { padding: 16, gap: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  modalText: {
    color: "#475569",
    fontSize: 14,
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  modalItemDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#e2e8f0",
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  pdfCard: {
    backgroundColor: "#1e3a8a",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 4,
  },
  pdfIcon: { fontSize: 40, marginBottom: 8 },
  pdfTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 4 },
  pdfSub: { color: "#93c5fd", fontSize: 13 },
  pdfDesc: {
    color: "#bfdbfe",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  pdfOption: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 5,
    elevation: 2,
  },
  pdfOptionIcon: { fontSize: 26 },
  pdfOptionLabel: { fontSize: 15, fontWeight: "800" },
  pdfOptionSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  pdfArrow: { fontSize: 22, fontWeight: "800" },
  pdfNote: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
    marginTop: 4,
  },
});
