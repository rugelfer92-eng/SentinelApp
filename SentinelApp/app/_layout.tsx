import { Buffer } from "buffer";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import {
  BluetoothProvider,
  useBluetooth,
} from "../src/bluetooth/BluetoothContext";
import {
  limpiarRegistrosViejos,
  syncWithCloud,
} from "../src/bluetooth/DataSync";
import { ConfigProvider } from "../src/context/ConfigContext";
import { initNotifications } from "../src/notifications/notificationService";

global.Buffer = Buffer;

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// 🔥 Componente interno para iniciar conexión Bluetooth
function BluetoothInitializer() {
  const { connect } = useBluetooth();

  useEffect(() => {
    console.log("🔥 Iniciando conexión Bluetooth...");
    connect().catch((err) => {
      console.log(
        "⚠️ No se pudo iniciar Bluetooth (la app continúa igual):",
        err,
      );
    });
  }, []);

  return null;
}

function LoadingScreen() {
  return (
    <View
      style={{ flex: 1, justifyContent: "center", backgroundColor: "#000" }}
    >
      <ActivityIndicator size="large" color="#52ff52" />
    </View>
  );
}

const SYNC_INTERVAL_MS = 60000;

function SyncScheduler() {
  useEffect(() => {
    limpiarRegistrosViejos();

    const interval = setInterval(() => {
      syncWithCloud();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}

function RootNavigator() {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  return (
    <>
      <BluetoothInitializer />
      <SyncScheduler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    initNotifications().catch((err) => {
      console.log("⚠️ No se pudo inicializar las notificaciones:", err);
    });

    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden")
        .then(() => NavigationBar.setBehaviorAsync("overlay-swipe"))
        .catch((err) => {
          console.log("⚠️ No se pudo ocultar la barra de navegación:", err);
        });
    }

    return () => {
      clearTimeout(timer);
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible")
          .catch((err) => {
            console.log("⚠️ No se pudo restaurar la barra de navegación:", err);
          });
      }
    };
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <ConfigProvider>
        <BluetoothProvider>
          <RootNavigator />
        </BluetoothProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
