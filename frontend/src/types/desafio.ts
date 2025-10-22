// /frontend/src/types/desafio.ts
export interface DesafioAdmin {
  desafio_id: number;
  titulo: string;
  descripcion: string | null;
  impacto: string | null;
  intentos_previos: string | null;
  solucion_imaginada: string | null;
  adjunto_url: string | null;
  fecha_creacion: string; // La mantenemos como string, la formateamos en la UI
  participante_nombre: string | null;
  organizacion: string | null;
  helice_nombre: string | null; // Nombre de la Hélice
  palabras_clave: string | null; // String separado por comas
}