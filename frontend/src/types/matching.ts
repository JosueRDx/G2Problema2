// /frontend/src/types/matching.ts

// Resultado cuando buscas capacidades para un desafío
export interface CapacidadMatch {
  capacidad_id: number;
  descripcion_capacidad: string;
  investigador_nombre: string | null;
  palabras_coincidentes: string; // Palabras clave que coincidieron (separadas por coma)
  total_coincidencias: number; // Número de palabras clave coincidentes
}

// Resultado cuando buscas desafíos para una capacidad
export interface DesafioMatch {
  desafio_id: number;
  titulo: string;
  participante_nombre: string | null;
  organizacion: string | null;
  palabras_coincidentes: string; // Palabras clave que coincidieron (separadas por coma)
  total_coincidencias: number; // Número de palabras clave coincidentes
}