import React, { createContext, useContext, useEffect, useState } from "react";
import { API_ROUTES } from "../api/apiConfig";

export interface ConfigLimits {
  temp_max: number;
  temp_min: number;
  volt_max: number;
  volt_min: number;
  hum_max: number;
  hum_min: number;
}

// Valores por defecto — deben coincidir con los del ESP32 en main.cpp
const DEFAULT_CONFIG: ConfigLimits = {
  temp_max: 5.0,
  temp_min: 2.0,
  volt_max: 130.0,
  volt_min: 90.0,
  hum_max: 85.0,
  hum_min: 40.0,
};

type ConfigContextType = {
  config: ConfigLimits;
  setConfig: (c: ConfigLimits) => void;
  refreshConfig: () => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export const ConfigProvider = ({ children }: any) => {
  const [config, setConfig] = useState<ConfigLimits>(DEFAULT_CONFIG);

  const refreshConfig = async () => {
    try {
      const response = await fetch(`${API_ROUTES.config}`);
      if (!response.ok) {
        throw new Error("No se pudo obtener la configuración del servidor");
      }
      const data = await response.json();
      setConfig({
        temp_max: data.temp_max,
        temp_min: data.temp_min,
        volt_max: data.volt_max,
        volt_min: data.volt_min,
        hum_max: data.hum_max,
        hum_min: data.hum_min,
      });
    } catch (err) {
      console.log("⚠️ Error refrescando configuración:", err);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, setConfig, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig debe usarse dentro de ConfigProvider");
  return ctx;
};
