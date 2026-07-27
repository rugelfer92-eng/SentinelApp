import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_ROUTES } from "../api/apiConfig";

export type UserRole = "admin" | "editor" | "viewer";

export interface AuthUser {
  _id: string;
  cedula: string;
  nombreApellido: string;
  cargo?: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoadingAuth: boolean;
  login: (
    cedula: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  canManageRole: (targetRole: UserRole) => boolean;
  canConfig: boolean;
  canViewPersonal: boolean;
  canViewConfig: boolean;
  canViewAuditoria: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Clave bajo la cual guardamos el usuario en el dispositivo
const STORAGE_KEY = "@sentinelcold_user";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Empieza en true: aún no sabemos si hay sesión guardada
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Restaura sesión guardada
  useEffect(() => {
    const restaurarSesion = async () => {
      try {
        const guardado = await AsyncStorage.getItem(STORAGE_KEY);
        if (guardado) {
          setUser(JSON.parse(guardado));
        }
      } catch (err) {
        console.log("⚠️ No se pudo restaurar la sesión:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    restaurarSesion();
  }, []);

  const login = async (
    cedula: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_ROUTES.empleados}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, password }),
      });
      if (!response.ok) {
        const err = await response.json();
        return {
          success: false,
          message: err.message || "Credenciales incorrectas",
        };
      }
      const data = await response.json();
      setUser(data.user);

      // Guardamos la sesión
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      } catch (err) {
        console.log("⚠️ No se pudo guardar la sesión:", err);
      }

      return { success: true, message: "Bienvenido" };
    } catch {
      return { success: false, message: "No se pudo conectar con el servidor" };
    }
  };

  const logout = async () => {
    if (user) {
      // Registrar logout en el servidor
      try {
        await fetch(`${API_ROUTES.empleados}/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: {
              id: user._id,
              nombre: user.nombreApellido,
              cedula: user.cedula,
              role: user.role,
            },
          }),
        });
      } catch {
        /* silencioso */
      }
    }

    // Borra la sesión guardada en el dispositivo
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.log("⚠️ No se pudo borrar la sesión guardada:", err);
    }

    setUser(null);
    router.replace("/");
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "editor") return targetRole === "viewer";
    return false;
  };

  const canConfig = user?.role === "admin" || user?.role === "editor";
  const canViewPersonal = user?.role === "admin" || user?.role === "editor";
  const canViewConfig = canConfig;
  const canViewAuditoria = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        login,
        logout,
        isAuthenticated: !!user,
        canManageRole,
        canConfig,
        canViewPersonal,
        canViewConfig,
        canViewAuditoria,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
