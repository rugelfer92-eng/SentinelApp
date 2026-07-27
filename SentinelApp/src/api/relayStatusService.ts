
/* 
import { API_ROUTES } from './apiConfig';

const API_URL = `${API_ROUTES.estados}`;

export const getRelayStatus = async (): Promise<boolean | null> => {
  try {
    const response = await fetch(`${API_URL}/relay`);
    if (!response.ok) throw new Error('Error al obtener estado');
    
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error("Error en getRelayStatus:", error);
    return null;
  }
};

export const updateRelayStatus = async (status: boolean): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error('Error al actualizar relé');
    
    return true;
  } catch (error) {
    console.error("Error en updateRelayStatus:", error);
    return false;
  }
};
*/