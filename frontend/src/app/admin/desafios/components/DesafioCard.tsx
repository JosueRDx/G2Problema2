// /frontend/src/app/admin/desafios/components/DesafioCard.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Ya deberías tenerlo instalado
import { DesafioAdmin } from '@/types/desafio';

interface DesafioCardProps {
  desafio: DesafioAdmin;
  onViewDetails: () => void;
}

export default function DesafioCard({ desafio, onViewDetails }: DesafioCardProps) {
  const keywords = desafio.palabras_clave
    ? desafio.palabras_clave.split(',').map(kw => kw.trim()).filter(kw => kw)
    : [];

  // Truncamiento (mantenemos la lógica por si acaso, aunque la imagen no lo muestra)
  const maxDescLength = 80; // Reducimos un poco para dar más énfasis al título
  const truncatedDesc = desafio.descripcion && desafio.descripcion.length > maxDescLength
    ? desafio.descripcion.substring(0, maxDescLength) + "..."
    : desafio.descripcion;
  const needsSeeMore = desafio.descripcion && desafio.descripcion.length > maxDescLength;

  return (
    // Card: Añadimos bordes más redondeados (rounded-xl)
    <Card className="flex flex-col h-full overflow-hidden border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"> {/* Más redondeado */}

      {/* CardHeader: Más padding */}
      <CardHeader className="pb-2 px-5 pt-5"> {/* Aumenta padding */}
        {/* CardTitle: Texto más grande y bold */}
        <CardTitle className="text-xl font-bold line-clamp-2 mb-1"> {/* Tamaño xl, bold */}
            {desafio.titulo}
        </CardTitle>
        {/* CardDescription: Texto más pequeño y gris */}
        <CardDescription className="text-xs text-gray-500 line-clamp-2 h-[36px]"> {/* Tamaño xs, gris, limita a 2 líneas */}
          {truncatedDesc || "Sin descripción detallada."}
        </CardDescription>
      </CardHeader>

      {/* CardContent: Lo usamos solo si hay "Ver más" o necesita espacio extra */}
      <CardContent className="flex-grow pt-2 pb-3 px-5">
         {/* Si la descripción es larga y necesita "Ver más", lo ponemos aquí */}
         {needsSeeMore && (
              <Button variant="link" size="sm" onClick={onViewDetails} className="text-xs px-0 py-0 h-auto text-blue-600 hover:text-blue-800 -mt-1">
                Leer descripción completa...
              </Button>
         )}
      </CardContent>

      {/* CardFooter: Contiene keywords y botón */}
      <CardFooter className="pt-0 pb-4 px-5 flex justify-between items-center">
         {/* Contenedor para las Palabras Clave */}
         <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 2).map((kw, index) => ( // Muestra max 2 keywords
              // Badge: Más redondeado (rounded-full), borde gris, texto pequeño
              <Badge key={index} variant="outline" className="text-[10px] px-2.5 py-0.5 font-medium border-gray-400 rounded-full bg-white text-gray-700"> {/* Estilo píldora */}
                {kw}
              </Badge>
            ))}
            {keywords.length > 2 && ( // Puntos suspensivos si hay más
               <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 font-medium border-gray-400 rounded-full bg-white text-gray-700">...</Badge>
            )}
         </div>

         {/* Botón "Ver Desafío" */}
         <Button
            size="sm"
            onClick={onViewDetails}
            // Estilo píldora negra con texto blanco
            className="h-7 px-4 text-xs bg-black text-white hover:bg-gray-800 rounded-full"
          >
            VER DESAFÍO
         </Button>
      </CardFooter>
    </Card>
  );
}