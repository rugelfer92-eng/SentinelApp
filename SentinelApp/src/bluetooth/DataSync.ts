import { Platform } from "react-native";
import { saveSensorData } from "../api/sensorService";

const SQLite = Platform.OS !== "web" ? require("expo-sqlite") : null;

const db = SQLite ? SQLite.openDatabaseSync("sentinel_local.db") : null;

const RETENTION_DAYS = 7;

const crearTablaSiNoExiste = () => {
  if (Platform.OS === "web" || !db) return;

  try {
    db.execSync(`
            CREATE TABLE IF NOT EXISTS lecturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temperatura REAL,
                voltaje REAL,
                humedad REAL,
                fecha TEXT
            );
        `);
    console.log("✅ SQLite: Tabla de lecturas lista.");
  } catch (error) {
    console.error("❌ Error al inicializar SQLite:", error);
  }
};
crearTablaSiNoExiste();

export const initLocalDB = crearTablaSiNoExiste;

export const saveToLocal = (temp: number, volt: number, hum: number) => {
  if (Platform.OS === "web" || !db) return; // Evitar error en navegador

  try {
    const now = new Date().toISOString();
    db.runSync(
      "INSERT INTO lecturas (temperatura, voltaje, humedad, fecha) VALUES (?, ?, ?, ?)",
      [temp, volt, hum, now],
    );
    console.log("Dato guardado localmente en SQLite");
  } catch (error) {
    console.error("Error al guardar en SQLite:", error);
  }
};

let isSyncing = false;

export const syncWithCloud = async (): Promise<number> => {
  if (Platform.OS === "web" || !db) return 0;
  if (isSyncing) return 0; // ya hay una sincronización en curso, no dupliquemos

  isSyncing = true;
  try {
    const rows: any[] = db.getAllSync("SELECT * FROM lecturas ORDER BY id ASC");
    if (rows.length === 0) return 0;

    let subidos = 0;

    for (const row of rows) {
      const exito = await saveSensorData({
        temperatura: row.temperatura,
        voltaje: row.voltaje,
        humedad: row.humedad,
        fecha: row.fecha,
      });

      if (exito) {
        db.runSync("DELETE FROM lecturas WHERE id = ?", [row.id]);
        subidos++;
      } else {
        break;
      }
    }

    if (subidos > 0) {
      console.log(
        `Sincronizados ${subidos} registro(s) pendientes con el servidor.`,
      );
    }

    return subidos;
  } catch (error) {
    console.error("Error en el proceso de sincronización:", error);
    return 0;
  } finally {
    isSyncing = false;
  }
};

export const getPendingSyncCount = async (): Promise<number> => {
  if (Platform.OS === "web" || !db) return 0;
  try {
    const rows: any[] = db.getAllSync("SELECT COUNT(*) as count FROM lecturas");
    return rows?.[0]?.count ?? 0;
  } catch (error) {
    console.error("Error contando registros pendientes:", error);
    return 0;
  }
};

export const getPendingSyncRecords = async (): Promise<any[]> => {
  if (Platform.OS === "web" || !db) return [];
  try {
    return db.getAllSync(
      "SELECT id, temperatura, voltaje, humedad, fecha FROM lecturas ORDER BY id ASC",
    );
  } catch (error) {
    console.error("Error leyendo registros pendientes:", error);
    return [];
  }
};

export const limpiarRegistrosViejos = () => {
  if (Platform.OS === "web" || !db) return;

  try {
    const limite = new Date();
    limite.setDate(limite.getDate() - RETENTION_DAYS);
    const limiteISO = limite.toISOString();

    const resultado: any = db.runSync("DELETE FROM lecturas WHERE fecha < ?", [
      limiteISO,
    ]);

    if (resultado?.changes) {
      console.log(
        `🧹 Se eliminaron ${resultado.changes} registro(s) locales de más de ${RETENTION_DAYS} días sin sincronizar.`,
      );
    }
  } catch (error) {
    console.error("Error limpiando registros antiguos:", error);
  }
};
