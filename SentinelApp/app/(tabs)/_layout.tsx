import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { colors } from "../../src/theme/globalStyles";
import { headerStyles } from "../../src/theme/headerStyles";

export default function TabLayout() {
  const {
    logout,
    user,
    isAuthenticated,
    canViewPersonal,
    canViewConfig,
    canViewAuditoria,
  } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#94a3b8",
        headerShown: true,
        headerStyle: headerStyles.headerContainer,

        // Sustituimos el título de texto por la imagen de cabecera 'header.png'
        headerTitle: () => (
          <Image
            source={require("../../assets/images/header.png")}
            style={headerStyles.headerLogo}
            resizeMode="contain"
          />
        ),
        headerTitleAlign: "left",

        headerRight: () => (
          <View style={headerStyles.rightContainer}>
            {/* ❌ El badge de rol (Admin) ha sido removido completamente */}

            {isAuthenticated ? (
              <>
                {/* Nombre del usuario logueado */}
                <View style={headerStyles.userBadge}>
                  <headerStyles.TextComponent style={headerStyles.userText}>
                    {user?.nombreApellido?.split(" ")[0]}
                  </headerStyles.TextComponent>
                </View>

                {/* Botón Salir */}
                <TouchableOpacity
                  onPress={logout}
                  style={headerStyles.logoutButton}
                >
                  <headerStyles.TextComponent style={headerStyles.logoutText}>
                    SALIR
                  </headerStyles.TextComponent>
                </TouchableOpacity>
              </>
            ) : (
              // Modo Invitado
              <TouchableOpacity
                onPress={() => router.push("/login")}
                style={headerStyles.loginButton}
              >
                <headerStyles.TextComponent style={headerStyles.loginText}>
                  INICIAR SESIÓN
                </headerStyles.TextComponent>
              </TouchableOpacity>
            )}
          </View>
        ),
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          height: Platform.OS === "android" ? 75 : 65,
          paddingBottom: Platform.OS === "android" ? 15 : 20,
          paddingTop: 5,
          elevation: 15,
          shadowOpacity: 0.1,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === "android" ? 5 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cava",
          tabBarIcon: ({ color }) => (
            <Ionicons name="snow-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="empleados"
        options={{
          title: "Personal",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={24} color={color} />
          ),
          href: canViewPersonal ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="config"
        options={{
          title: "Config",
          tabBarIcon: ({ color }) => (
            <Ionicons name="options-outline" size={24} color={color} />
          ),
          href: canViewConfig ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="auditoria"
        options={{
          title: "Auditoría",
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-checkmark-outline" size={24} color={color} />
          ),
          href: canViewAuditoria ? undefined : null,
        }}
      />
    </Tabs>
  );
}
