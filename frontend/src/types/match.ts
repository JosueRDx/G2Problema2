export type MatchEstado =
  | 'pendiente_unsa'
  | 'pendiente_externo'
  | 'aceptado'
  | 'rechazado_unsa'
  | 'rechazado_externo'
  | 'cancelado';

export interface MatchRecord {
  match_id: number;
  desafio_id: number;
  capacidad_id: number;
  solicitante_usuario_id: number;
  receptor_usuario_id: number;
  estado: MatchEstado;
  fecha_creacion: string;
  fecha_actualizacion: string;
  desafio_titulo?: string;
  capacidad_desc_corta?: string;
  solicitante_email?: string;
  receptor_email?: string;
  desafio_participante_nombre?: string;
  capacidad_investigador_nombre?: string;
}

export interface MatchMessage {
  mensaje_id: number;
  match_id: number;
  remitente_usuario_id: number;
  contenido: string;
  fecha_envio: string;
  leido: number;
  remitente_email?: string;
  remitente_nombre?: string | null;
}