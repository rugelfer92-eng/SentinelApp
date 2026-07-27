import { StyleSheet, Text } from "react-native";

export const headerStyles = {
  TextComponent: Text,

  ...StyleSheet.create({
    headerContainer: {
      backgroundColor: "#0b1220",
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: "#1e293b",
    },
    headerLogo: {
      width: 140,
      height: 35,
      marginLeft: -4,
    },
    rightContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
      gap: 8,
    },
    userBadge: {
      backgroundColor: "#1e293b",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#334155",
    },
    userText: {
      fontSize: 11,
      color: "#e2e8f0",
      fontWeight: "600",
    },
    logoutButton: {
      backgroundColor: "#ef44441a",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#ef444440",
    },
    logoutText: {
      fontSize: 11,
      color: "#f87171",
      fontWeight: "700",
    },
    loginButton: {
      backgroundColor: "#2563eb22",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#2563eb40",
    },
    loginText: {
      fontSize: 11,
      color: "#60a5fa",
      fontWeight: "700",
    },
  }),
};
