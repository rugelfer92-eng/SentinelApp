
import { API_ROUTES } from './apiConfig';

const API_URL = `${API_ROUTES.config}`;

export interface ConfigData {
    temp_max: number;
    temp_min: number;
    volt_max: number;
    volt_min: number;
    hum_max: number;
    hum_min: number;
    actualizadoEn?: string;
}

export const getConfiguracion = async (): Promise<ConfigData | null> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error al obtener la configuración:", error);
        return null;
    }
};

export const updateConfiguracion = async (nuevaConfig: ConfigData): Promise<boolean> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nuevaConfig),
        });

        return response.ok;
    } catch (error) {
        console.error("Error al actualizar la configuración:", error);
        return false;
    }
};
