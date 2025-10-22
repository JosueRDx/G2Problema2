// /frontend/src/app/admin/desafios/page.tsx
"use client"; // Necesario para usar Hooks (useState, useEffect)

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // Para leer la cookie de autenticación
import { toast } from 'sonner'; // Para mostrar notificaciones
import DesafioCard from './components/DesafioCard'; // Importa el componente de tarjeta que creamos
import DesafioDetailModal from './components/DesafioDetailModal'; // Importa el componente modal que creamos
import { DesafioAdmin } from '@/types/desafio'; // Importa el tipo de datos del desafío
import Link from 'next/link'; // Para el enlace de regreso al dashboard

// Componente principal de la página
export default function AdminDesafiosPage() {
  // --- Estados del Componente ---
  const [desafios, setDesafios] = useState<DesafioAdmin[]>([]); // Array para guardar los desafíos
  const [isLoading, setIsLoading] = useState(true); // Estado para mostrar mensaje de carga
  const [error, setError] = useState<string | null>(null); // Estado para mostrar mensajes de error
  const [selectedDesafio, setSelectedDesafio] = useState<DesafioAdmin | null>(null); // Guarda el desafío que se mostrará en el modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Controla si el modal está visible o no

  // --- Efecto para Cargar Datos ---
  useEffect(() => {
    // Función asíncrona para obtener los desafíos del backend
    const fetchDesafios = async () => {
      setIsLoading(true); // Inicia la carga
      setError(null);    // Limpia errores previos
      const token = Cookies.get('token'); // Obtiene el token de las cookies

      // Verifica si el usuario está autenticado
      if (!token) {
        setError("No autenticado.");
        setIsLoading(false);
        toast.error("Error de autenticación", { description: "Por favor, inicie sesión." });
        // Podrías redirigir al login aquí si prefieres
        // import { useRouter } from 'next/navigation';
        // const router = useRouter(); router.push('/login?error=unauthorized');
        return;
      }

      try {
        // Llama al endpoint del backend para obtener todos los desafíos (protegido por token)
        const res = await fetch("http://localhost:3001/api/desafios", {
          method: 'GET', // Método GET por defecto, pero explícito es bueno
          headers: {
              "Authorization": `Bearer ${token}` // Envía el token en la cabecera
          }
        });

        // Si la respuesta no es exitosa (ej: 401, 403, 500)
        if (!res.ok) {
          let errorMsg = `Error ${res.status}: No se pudieron cargar los desafíos.`;
          try {
              // Intenta leer un mensaje de error específico del backend
              const errorData = await res.json();
              errorMsg = errorData.message || errorMsg;
          } catch (jsonError) {
              // Si no hay JSON o falla, usa el mensaje genérico
              console.error("No se pudo parsear el error JSON:", jsonError);
          }
          throw new Error(errorMsg); // Lanza un error para ser capturado por el catch
        }

        // Si la respuesta fue exitosa, convierte el cuerpo a JSON
        const data: DesafioAdmin[] = await res.json();
        setDesafios(data); // Actualiza el estado con los desafíos recibidos

      } catch (err: any) { // Captura cualquier error (fetch, throw new Error, etc.)
        console.error("Error fetching desafios:", err);
        setError(err.message); // Guarda el mensaje de error para mostrarlo
        toast.error("Error al cargar desafíos", { description: err.message });
      } finally {
        setIsLoading(false); // Finaliza el estado de carga (tanto si hubo éxito como error)
      }
    };

    fetchDesafios(); // Llama a la función para cargar datos cuando el componente se monta
  }, []); // El array vacío [] significa que este efecto se ejecuta solo una vez al montar

  // --- Funciones Handler para el Modal ---

  // Se ejecuta cuando se hace clic en "Ver Desafío" o "Ver más" en una tarjeta
  const handleViewDetails = (desafio: DesafioAdmin) => {
    setSelectedDesafio(desafio); // Guarda qué desafío se seleccionó
    setIsModalOpen(true);      // Marca el modal como abierto
  };

  // Se ejecuta cuando el componente Dialog informa que debe cerrarse (clic fuera, botón cerrar, Esc)
  const handleCloseModal = () => {
    setIsModalOpen(false);      // Marca el modal como cerrado
    setSelectedDesafio(null); // Limpia el desafío seleccionado
  };

  // --- Renderizado Condicional ---

  // Muestra mensaje mientras carga
  if (isLoading) return <p className="p-6 text-center text-neutral-600 animate-pulse">Cargando desafíos...</p>;

  // Muestra mensaje si hubo un error al cargar
  if (error) return <p className="p-6 text-center text-red-600">⚠️ Error al cargar: {error}</p>;

  // --- Renderizado Principal de la Página ---
  return (
    // Contenedor principal con espaciado vertical
    <div className="space-y-6"> {/* Ajusta padding si tu AdminLayout no lo incluye */}

      {/* Cabecera de la página */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Desafíos Registrados</h1>
        {/* Aquí podrías añadir en el futuro botones para filtrar, buscar, etc. */}
      </div>

      {/* Muestra un mensaje si no hay desafíos o el grid de tarjetas si los hay */}
      {desafios.length === 0 ? (
        // Mensaje centrado y estilizado cuando no hay datos
        <div className="border rounded-lg p-10 text-center bg-gray-50 mt-4">
          <p className="text-neutral-500">Aún no se han registrado desafíos.</p>
        </div>
      ) : (
        // Grid responsivo para las tarjetas: 1 columna en móvil, 2 en sm, 3 en lg, 4 en xl
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Itera sobre el array de desafíos */}
          {desafios.map((desafio) => (
            // Renderiza un componente DesafioCard por cada desafío
            <DesafioCard
              key={desafio.desafio_id} // Clave única para React
              desafio={desafio} // Pasa los datos del desafío a la tarjeta
              onViewDetails={() => handleViewDetails(desafio)} // Pasa la función para abrir el modal
            />
          ))}
        </div>
      )}

      {/* Renderiza el componente Modal. Solo es visible si isModalOpen es true */}
      {/* Se usa selectedDesafio && ... para asegurar que solo se renderiza si hay datos */}
      {selectedDesafio && (
        <DesafioDetailModal
          isOpen={isModalOpen} // Controla si se muestra o no
          onClose={handleCloseModal} // Pasa la función para cerrarlo
          desafio={selectedDesafio} // Pasa los datos del desafío seleccionado
        />
      )}

      {/* Enlace opcional para volver al dashboard principal del admin */}
      <div className="pt-4">
        <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}