import { Platform } from "react-native";

const LAPTOP_IP = "192.168.1.4"; // ← CAMBIA ESTO POR LA IP DE TU LAPTOP EN LA RED LOCAL
const PORT = "3000";

export const BASE_URL =
  Platform.OS === "web"
    ? `http://localhost:${PORT}`
    : `http://${LAPTOP_IP}:${PORT}`;

export const API_ROUTES = {
  sensores: `${BASE_URL}/api/sensores`,
  config: `${BASE_URL}/api/config`,
  empleados: `${BASE_URL}/api/empleados`,
  estados: `${BASE_URL}/api/estados`,
};
