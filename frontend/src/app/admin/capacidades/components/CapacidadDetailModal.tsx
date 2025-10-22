// /frontend/src/app/admin/capacidades/components/CapacidadDetailModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapacidadAdmin } from '@/types/capacidad';

interface CapacidadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  capacidad: CapacidadAdmin;
}

export default function CapacidadDetailModal({ isOpen, onClose, capacidad }: CapacidadDetailModalProps) {
    const keywords = capacidad.palabras_clave
        ? capacidad.palabras_clave.split(',').map(kw => kw.trim()).filter(kw => kw)
        : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          {/* Título principal es la descripción completa */}
          <DialogTitle className="text-xl font-bold">Capacidad Registrada</DialogTitle>
          <DialogDescription className="text-sm text-neutral-600 pt-1">
            {/* Información del investigador */}
            Investigador: {capacidad.investigador_nombre || 'No especificado'}
            {capacidad.clave_interna && ` | Clave Interna: ${capacidad.clave_interna}`}
          </DialogDescription>
        </DialogHeader>

        {/* Cuerpo del Modal con scroll */}
        <div className="py-4 space-y-4 text-sm overflow-y-auto flex-grow pr-2">

          {/* Descripción */}
          <div>
            <h4 className="font-semibold mb-1 text-neutral-800">Descripción Detallada:</h4>
            <p className="text-neutral-700 whitespace-pre-wrap">{capacidad.descripcion_capacidad}</p>
          </div>

          {/* Secciones Opcionales */}
          {capacidad.problemas_que_resuelven && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Problemas que puede resolver:</h4>
              <p className="text-neutral-700 whitespace-pre-wrap">{capacidad.problemas_que_resuelven}</p>
            </div>
          )}
           {capacidad.tipos_proyectos && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Tipos de Proyectos de Interés:</h4>
              <p className="text-neutral-700 whitespace-pre-wrap">{capacidad.tipos_proyectos}</p>
            </div>
          )}
           {capacidad.equipamiento && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Equipamiento Disponible:</h4>
              <p className="text-neutral-700 whitespace-pre-wrap">{capacidad.equipamiento}</p>
            </div>
          )}

          {/* Palabras Clave */}
           {keywords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1 text-neutral-800">Palabras Clave Asociadas:</h4>
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        </div> {/* Fin cuerpo scrollable */}

        {/* Pie del Modal */}
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
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