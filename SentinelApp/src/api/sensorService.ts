import { API_ROUTES } from "./apiConfig";

// ✅ Esto YA incluye "/api/sensores" (ver apiConfig.ts) — no hay que
// volver a agregarlo en cada fetch de abajo, o se duplica la ruta.
const BASE_URL = `${API_ROUTES.sensores}`;

// ✅ TypeScript tipa el catch como "unknown" — no se puede leer .message
// directo sin antes verificar que sí es un Error. Este helper lo hace seguro.
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export interface SensorData {
  fecha: string;
  temperatura: number;
  voltaje: number;
  humedad: number;
  error?: boolean;
}

// Obtener el último dato (para el Dashboard)
export const getLatestData = async (): Promise<SensorData> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // ❌ Antes: `${BASE_URL}/api/sensores/ultimo` -> .../api/sensores/api/sensores/ultimo (404)
    const response = await fetch(`${BASE_URL}/ultimo`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Error en la respuesta");

    const data = await response.json();

    return {
      temperatura: data.temperatura ?? 0,
      voltaje: data.voltaje ?? 0,
      humedad: data.humedad ?? 0,
      fecha: data.fecha || new Date().toISOString(),
    };
  } catch (error) {
    console.warn(
      "📡 Sentinel-Cold: sin conexión al servidor todavía:",
      getErrorMessage(error),
    );
    return {
      temperatura: 0,
      voltaje: 0,
      humedad: 0,
      fecha: new Date().toISOString(),
      error: true,
    };
  }
};

// Nueva función para el Historial (ventana de tiempo)
export const getHistorialPorHora = async (
  hora: string,
): Promise<SensorData[]> => {
  try {
    // ❌ Antes: `${BASE_URL}/api/sensores/ventana?...` -> ruta duplicada (404)
    const response = await fetch(`${BASE_URL}/ventana?hora=${hora}`);
    if (!response.ok) throw new Error("Error al consultar historial");
    return await response.json();
  } catch (error) {
    console.error("❌ Error Historial:", error);
    throw error;
  }
};

// la función que se llama desde DataSync para subir datos a MongoDB
export const saveSensorData = async (datos: SensorData): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // ❌ Antes: `${BASE_URL}/api/sensores` -> ruta duplicada (404)
    const response = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(
      "⚠️ Sin conexión al servidor, el dato queda en cola:",
      getErrorMessage(error),
    );
    return false;
  }
};
