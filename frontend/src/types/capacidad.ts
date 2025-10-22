// /frontend/src/types/capacidad.ts
export interface CapacidadAdmin {
  capacidad_id: number;
  investigador_id: number; // Podría ser útil tenerlo
  descripcion_capacidad: string;
  problemas_que_resuelven: string | null;
  tipos_proyectos: string | null;
  equipamiento: string | null;
  clave_interna: string | null;
  // Campos añadidos por el backend (JOINs)
  investigador_nombre: string | null; // Nombre del investigador
  palabras_clave: string | null; // String separado por comas
}