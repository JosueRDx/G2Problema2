// /frontend/src/app/admin/desafios/components/DesafioDetailModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"; // Componentes del modal de Shadcn UI
import { Button } from "@/components/ui/button"; // Botón
import { Badge } from "@/components/ui/badge"; // Etiquetas
import { DesafioAdmin } from '@/types/desafio'; // Tipo de datos del desafío
import Link from "next/link"; // Para crear enlaces
import { Paperclip } from 'lucide-react'; // Icono para el adjunto (parte de lucide-react)

// Propiedades que recibe el modal
interface DesafioDetailModalProps {
  isOpen: boolean;        // Indica si el modal está abierto o cerrado
  onClose: () => void;     // Función para cerrar el modal
  desafio: DesafioAdmin; // Los datos completos del desafío a mostrar
}

// Función auxiliar para formatear la fecha y hora
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    // Formato español con día, mes, año, hora y minutos
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true // O hour12: false para formato 24h
    });
  } catch (e) {
    console.error("Error formateando fecha:", e);
    return dateString; // Devuelve el original si hay error
  }
};

export default function DesafioDetailModal({ isOpen, onClose, desafio }: DesafioDetailModalProps) {
    // Procesa las palabras clave para mostrarlas como etiquetas
    const keywords = desafio.palabras_clave
        ? desafio.palabras_clave.split(',').map(kw => kw.trim()).filter(kw => kw)
        : [];

    // Construye la URL completa y absoluta para el archivo adjunto
    // Usa la URL base de tu backend (¡ajusta si es diferente!)
    const attachmentUrl = desafio.adjunto_url
        ? `http://localhost:3001${desafio.adjunto_url}` // Asume backend en puerto 3001
        : null; // Si no hay adjunto_url, es null

  return (
    // Componente Dialog principal, controla su estado con 'open' y 'onOpenChange'
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* DialogContent es el contenedor visible del modal */}
      {/* Clases para tamaño, altura máxima y scroll interno si el contenido excede */}
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">

        {/* DialogHeader: Cabecera del modal */}
        <DialogHeader className="flex-shrink-0 border-b pb-4"> {/* Borde inferior */}
          <DialogTitle className="text-xl font-bold">{desafio.titulo}</DialogTitle>
          <DialogDescription className="text-sm text-neutral-600 pt-1">
            {/* Muestra información adicional del registrante y fecha */}
            Registrado por: {desafio.participante_nombre || 'N/A'} ({desafio.organizacion || 'N/A'})
            <br />
            Hélice: {desafio.helice_nombre || 'N/A'} | Fecha: {formatDate(desafio.fecha_creacion)}
          </DialogDescription>
        </DialogHeader>

        {/* Cuerpo del Modal: Contenido principal con scroll */}
        {/* overflow-y-auto habilita el scroll vertical si es necesario */}
        {/* flex-grow hace que esta sección ocupe el espacio disponible */}
        <div className="py-4 space-y-4 text-sm overflow-y-auto flex-grow pr-2"> {/* Padding y espacio para scrollbar */}

          {/* Sección Descripción */}
          <div>
            <h4 className="font-semibold mb-1 text-neutral-800">Descripción Detallada:</h4>
            {/* whitespace-pre-wrap respeta los saltos de línea del texto original */}
            <p className="text-neutral-700 whitespace-pre-wrap">{desafio.descripcion || "No proporcionada."}</p>
          </div>

          {/* Secciones opcionales: Solo se muestran si tienen contenido */}
          {desafio.impacto && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Impacto Esperado:</h4>
              <p className="text-neutral-700 whitespace-pre-wrap">{desafio.impacto}</p>
            </div>
          )}
           {desafio.intentos_previos && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Intentos Previos:</h4>
              <p className="text-neutral-700 whitespace-pre-wrap">{desafio.intentos_previos}</p>
            </div>
          )}
           {desafio.solucion_imaginada && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Solución Imaginada:</h4>
              <p className="text-neutral-700 whitespace-pre-wrap">{desafio.solucion_imaginada}</p>
            </div>
          )}

          {/* Sección Palabras Clave */}
           {keywords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Palabras Clave:</h4>
              <div className="flex flex-wrap gap-1">
                {/* Mapea cada palabra clave a un componente Badge */}
                {keywords.map((kw, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sección Archivo Adjunto */}
           {attachmentUrl && ( // Solo se muestra si hay una URL de adjunto
              <div>
                <h4 className="font-semibold mb-1 text-neutral-800">Archivo Adjunto:</h4>
                {/* Componente Link de Next.js para el enlace */}
                <Link
                   href={attachmentUrl} // URL completa del archivo en el backend
                   target="_blank" // Para abrir en una nueva pestaña
                   rel="noopener noreferrer" // Por seguridad
                   className="text-blue-600 hover:underline break-all inline-flex items-center gap-1" // Estilos
                >
                  <Paperclip className="w-3 h-3"/> {/* Icono de clip */}
                  {/* Extrae el nombre del archivo de la URL para mostrarlo */}
                  {desafio.adjunto_url?.split('/').pop() || 'Ver Archivo'}
                </Link>
              </div>
           )}

        </div> {/* Fin del cuerpo scrollable */}

        {/* Pie del Modal */}
        <DialogFooter className="flex-shrink-0 pt-4 border-t"> {/* Borde superior */}
          {/* DialogClose envuelve el botón para que cierre el modal al hacer clic */}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}