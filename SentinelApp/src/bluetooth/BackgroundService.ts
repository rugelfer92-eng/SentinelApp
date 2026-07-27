import { NativeModules, Platform } from "react-native";

const { BluetoothForegroundService } = NativeModules as {
  BluetoothForegroundService?: {
    startService: () => void;
    stopService: () => void;
  };
};

export const startBackgroundService = async () => {
  if (Platform.OS !== "android") return;
  if (!BluetoothForegroundService) {
    console.log("⚠️ Módulo nativo BluetoothForegroundService no disponible en Android.");
    return;
  }

  if (typeof BluetoothForegroundService.startService !== "function") {
    console.log("⚠️ BluetoothForegroundService.startService no está implementado.");
    return;
  }

  try {
    BluetoothForegroundService.startService();
  } catch (error) {
    console.log("Error iniciando servicio en segundo plano:", error);
  }
};

export const stopBackgroundService = async () => {
  if (Platform.OS !== "android") return;
  if (!BluetoothForegroundService) {
    console.log("⚠️ Módulo nativo BluetoothForegroundService no disponible en Android.");
    return;
  }

  if (typeof BluetoothForegroundService.stopService !== "function") {
    console.log("⚠️ BluetoothForegroundService.stopService no está implementado.");
    return;
  }

  try {
    BluetoothForegroundService.stopService();
  } catch (error) {
    console.log("Error deteniendo servicio en segundo plano:", error);
  }
};
