// /frontend/src/app/admin/capacidades/components/CapacidadCard.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapacidadAdmin } from '@/types/capacidad'; // Importa el tipo que acabamos de crear

interface CapacidadCardProps {
  capacidad: CapacidadAdmin;
  onViewDetails: () => void; // Función para abrir el modal
}

export default function CapacidadCard({ capacidad, onViewDetails }: CapacidadCardProps) {
  // Procesa las palabras clave
  const keywords = capacidad.palabras_clave
    ? capacidad.palabras_clave.split(',').map(kw => kw.trim()).filter(kw => kw)
    : [];

  // Trunca la descripción principal (ajusta el largo si es necesario)
  const maxDescLength = 100;
  const truncatedDesc = capacidad.descripcion_capacidad.length > maxDescLength
    ? capacidad.descripcion_capacidad.substring(0, maxDescLength) + "..."
    : capacidad.descripcion_capacidad;
  const needsSeeMore = capacidad.descripcion_capacidad.length > maxDescLength;

  return (
    <Card className="flex flex-col h-full overflow-hidden border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2 px-5 pt-5">
         {/* Título: Usaremos la descripción truncada como título principal de la tarjeta */}
        <CardTitle className="text-base font-semibold line-clamp-3 h-[72px]"> {/* Permite hasta 3 líneas */}
            {truncatedDesc}
        </CardTitle>
         {/* Descripción: Mostramos el nombre del investigador */}
        <CardDescription className="text-xs text-gray-500 pt-1">
          Investigador: {capacidad.investigador_nombre || "No especificado"}
        </CardDescription>
      </CardHeader>

      {/* Dejamos CardContent vacío o para un futuro "Ver más" si aplica */}
      <CardContent className="flex-grow pt-1 pb-3 px-5">
         {/* Si necesitas mostrar "Ver más" para la descripción, iría aquí */}
         {needsSeeMore && (
            <Button variant="link" size="sm" onClick={onViewDetails} className="text-xs px-0 py-0 h-auto text-blue-600 hover:text-blue-800 -mt-1">
                Leer descripción completa...
            </Button>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4 px-5 flex justify-between items-center">
         {/* Palabras Clave */}
         <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 2).map((kw, index) => (
              <Badge key={index} variant="outline" className="text-[10px] px-2.5 py-0.5 font-medium border-gray-400 rounded-full bg-white text-gray-700">
                {kw}
              </Badge>
            ))}
            {keywords.length > 2 && (
               <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-medium border-gray-400 rounded-full bg-white text-gray-700">...</Badge>
            )}
         </div>

         {/* Botón */}
         <Button
            size="sm"
            onClick={onViewDetails}
            className="h-7 px-4 text-xs bg-black text-white hover:bg-gray-800 rounded-full"
          >
            VER CAPACIDAD
         </Button>
      </CardFooter>
    </Card>
  );
}