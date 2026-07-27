import { API_ROUTES } from "./apiConfig";

const API_URL = `${API_ROUTES.empleados}`;

export interface Empleado {
  _id?: string;
  cedula: string;
  nombreApellido: string;
  telefono?: string;
  cargo?: string;
  diasLaborales?: string[];
  turno?: string;
  role?: "admin" | "editor" | "viewer";
}

type AuditUser = { id?: string; nombre?: string; role?: string };

// callerRole se envía como query param para que el backend filtre correctamente
export const getEmpleados = async (
  callerRole: string = "viewer",
): Promise<Empleado[]> => {
  const response = await fetch(`${API_URL}?callerRole=${callerRole}`);
  if (!response.ok) throw new Error("Error al obtener empleados");
  return response.json();
};

export const createEmpleado = async (
  empleado: Empleado & { password?: string; _auditUser?: AuditUser },
): Promise<Empleado> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(empleado),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Error al crear el registro");
  }
  return response.json();
};

export const updateEmpleado = async (
  id: string,
  empleado: Partial<Empleado> & { password?: string; _auditUser?: AuditUser },
): Promise<Empleado> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(empleado),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Error al actualizar el registro");
  }
  return response.json();
};

export const deleteEmpleado = async (
  id: string,
  auditorId: string,
  auditorNombre: string,
  auditorRole: string,
): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _auditUser: { id: auditorId, nombre: auditorNombre, role: auditorRole },
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Error al eliminar el registro");
  }
};
