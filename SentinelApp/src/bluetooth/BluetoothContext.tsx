import React, { createContext, useContext, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import base64 from "react-native-base64";
import { BleManager, Device, State } from "react-native-ble-plx";
import { saveToLocal } from "../bluetooth/DataSync";
import { startBackgroundService, stopBackgroundService } from "./BackgroundService";

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const IS_WEB = Platform.OS === "web";
const SCAN_TIMEOUT_MS = 10000;

type SensorData = {
  temperatura: number;
  humedad: number;
  voltaje: number;
};

type BluetoothContextType = {
  device: Device | null;
  isConnected: boolean;
  isScanning: boolean;
  sensorData: SensorData | null;
  relayState: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (data: any) => void;
};

const BluetoothContext = createContext<BluetoothContextType | null>(null);

export const BluetoothProvider = ({ children }: any) => {
  const managerRef = useRef<BleManager | null>(
    IS_WEB ? null : new BleManager(),
  );

  const [device, setDevice] = useState<Device | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [relayState, setRelayState] = useState(false);

  const lastSaveRef = useRef(0);
  const SAVE_INTERVAL_MS = 15000;

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;

    try {
      const permisosRequeridos: string[] = [];
      const permisosOpcionales: string[] = [];

      if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) {
        permisosRequeridos.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
      }

      if (PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
        permisosRequeridos.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }

      if (PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION) {
        permisosRequeridos.push(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
      }

      if (
        Platform.Version >= 31 &&
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      ) {
        permisosOpcionales.push(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
      }

      if (permisosRequeridos.length === 0) {
        console.log(
          "ℹNo hay permisos BLE disponibles para solicitar en esta versión de React Native.",
        );
        return true;
      }

      const resultadosRequeridos = await PermissionsAndroid.requestMultiple(
        permisosRequeridos as any,
      );

      const requiredGranted = permisosRequeridos.every((perm) => {
        const key = perm as keyof typeof resultadosRequeridos;
        return resultadosRequeridos[key] === PermissionsAndroid.RESULTS.GRANTED;
      });

      if (!requiredGranted) {
        console.log("No se concedieron los permisos BLE requeridos:", resultadosRequeridos);
        return false;
      }

      if (permisosOpcionales.length > 0) {
        const resultadosOpcionales = await PermissionsAndroid.requestMultiple(
          permisosOpcionales as any,
        );

        const optionalGranted = permisosOpcionales.every((perm) => {
          const key = perm as keyof typeof resultadosOpcionales;
          return resultadosOpcionales[key] === PermissionsAndroid.RESULTS.GRANTED;
        });

        if (!optionalGranted) {
          console.log(
            "No se concedió ACCESS_BACKGROUND_LOCATION. La app seguirá funcionando en primer plano.",
          );
        }
      }

      return true;
    } catch (err) {
      console.log("Error pidiendo permisos BLE:", err);
      return false;
    }
  };

  // Conectar al ESP32
  const connect = async () => {
    if (IS_WEB || !managerRef.current) {
      console.log("Bluetooth no disponible en esta plataforma (web).");
      return;
    }

    try {
      const tienePermisos = await requestPermissions();
      if (!tienePermisos) {
        console.log(
          "Permisos de Bluetooth no concedidos. La app sigue sin conexión BLE.",
        );
        return;
      }

      const estado = await managerRef.current.state();
      if (estado !== State.PoweredOn) {
        console.log("El Bluetooth del dispositivo está apagado:", estado);
        return;
      }

      console.log("Buscando ESP32...");
      setIsScanning(true);

      managerRef.current.startDeviceScan(
        null,
        null,
        async (error, scannedDevice) => {
          if (error) {
            console.log("Error durante el escaneo:", error.message);
            setIsScanning(false);
            return;
          }

          if (scannedDevice?.name === "ESP32-Sentinel") {
            console.log("Encontrado:", scannedDevice.name);
            managerRef.current?.stopDeviceScan();
            setIsScanning(false);

            try {
              const connectedDevice = await scannedDevice.connect({
                requestMTU: 247,
              });
              await connectedDevice.discoverAllServicesAndCharacteristics();

              console.log("Conectado");
              setDevice(connectedDevice);
              setIsConnected(true);

              startBackgroundService().catch((error) => {
                console.log("No se pudo iniciar el servicio en segundo plano:", error);
              });

              connectedDevice.onDisconnected(() => {
                console.log("El ESP32 se desconectó");
                setDevice(null);
                setIsConnected(false);
                stopBackgroundService().catch((error) => {
                  console.log("No se pudo detener el servicio en segundo plano:", error);
                });
              });

              startListening(connectedDevice);
            } catch (err) {
              console.log("Error conectando al dispositivo:", err);
            }
          }
        },
      );

      setTimeout(() => {
        managerRef.current?.stopDeviceScan();
        setIsScanning(false);
      }, SCAN_TIMEOUT_MS);
    } catch (err) {
      console.log("Error iniciando el escaneo BLE:", err);
      setIsScanning(false);
    }
  };

  const disconnect = async () => {
    if (!device) return;

    try {
      await device.cancelConnection();
    } catch (err) {
      console.log("Error al desconectar:", err);
    } finally {
      setDevice(null);
      setIsConnected(false);
      stopBackgroundService().catch((error) => {
        console.log("No se pudo detener el servicio en segundo plano:", error);
      });
      console.log("Desconectado");
    }
  };

  const startListening = (device: Device) => {
    console.log("Escuchando datos...");

    device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.log("Error monitor:", error.message);
          return;
        }

        if (!characteristic?.value) return;

        try {
          const decoded = Buffer.from(characteristic.value, "base64").toString(
            "utf-8",
          );
          handleIncomingData(decoded);
        } catch (err) {
          console.log("Error decodificando datos BLE:", err);
        }
      },
    );
  };

  
  const handleIncomingData = (raw: string) => {
    try {
      const data = JSON.parse(raw);

      setSensorData({
        temperatura: data.temp,
        humedad: data.hum,
        voltaje: data.volt,
      });

      setRelayState(data.relay === 0);

      const ahora = Date.now();
      if (ahora - lastSaveRef.current >= SAVE_INTERVAL_MS) {
        lastSaveRef.current = ahora;
        saveToLocal(data.temp, data.volt, data.hum);
      }
    } catch {
      console.log("Error parseando datos del ESP32:", raw);
    }
  };

  const sendMessage = async (data: any) => {
    if (!device) {
      console.log("No hay dispositivo conectado, no se envió el mensaje.");
      return;
    }

    try {
      const json = JSON.stringify(data);
      const encoded = base64.encode(json);

      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        encoded,
      );

      console.log("Enviado:", json);
    } catch (error) {
      console.log("Error enviando al ESP32:", error);
    }
  };

  return (
    <BluetoothContext.Provider
      value={{
        device,
        isConnected,
        isScanning,
        sensorData,
        relayState,
        connect,
        disconnect,
        sendMessage,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error("useBluetooth debe usarse dentro de BluetoothProvider");
  }
  return context;
};
