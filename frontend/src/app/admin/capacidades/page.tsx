// /frontend/src/app/admin/capacidades/page.tsx
"use client"; // Necesario para Hooks

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // Para leer el token
import { toast } from 'sonner'; // Para notificaciones
import CapacidadCard from './components/CapacidadCard'; // Importa la tarjeta de capacidad
import CapacidadDetailModal from './components/CapacidadDetailModal'; // Importa el modal de capacidad
import { CapacidadAdmin } from '@/types/capacidad'; // Importa el tipo de datos
import Link from 'next/link'; // Para el enlace de regreso

// Componente principal de la página
export default function AdminCapacidadesPage() {
  // --- Estados ---
  const [capacidades, setCapacidades] = useState<CapacidadAdmin[]>([]); // Array para las capacidades
  const [isLoading, setIsLoading] = useState(true); // Control de carga
  const [error, setError] = useState<string | null>(null); // Control de errores
  const [selectedCapacidad, setSelectedCapacidad] = useState<CapacidadAdmin | null>(null); // Capacidad para el modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Visibilidad del modal

  // --- Efecto para Cargar Datos ---
  useEffect(() => {
    const fetchCapacidades = async () => {
      setIsLoading(true);
      setError(null);
      const token = Cookies.get('token');

      if (!token) {
        setError("No autenticado.");
        setIsLoading(false);
        toast.error("Error de autenticación", { description: "Por favor, inicie sesión." });
        // Considera redirigir al login
        return;
      }

      try {
        // Llama al endpoint del backend para obtener TODAS las capacidades (protegido)
        const res = await fetch("http://localhost:3001/api/capacidades", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
          let errorMsg = `Error ${res.status}: No se pudieron cargar las capacidades.`;
          try {
              const errorData = await res.json();
              errorMsg = errorData.message || errorMsg;
          } catch (jsonError) {}
          throw new Error(errorMsg);
        }

        const data: CapacidadAdmin[] = await res.json();
        setCapacidades(data); // Guarda las capacidades en el estado

      } catch (err: any) {
        console.error("Error fetching capacidades:", err);
        setError(err.message);
        toast.error("Error al cargar capacidades", { description: err.message });
      } finally {
        setIsLoading(false); // Finaliza la carga
      }
    };

    fetchCapacidades(); // Llama a la función al montar
  }, []); // Se ejecuta solo una vez

  // --- Handlers del Modal ---

  // Abre el modal con la capacidad seleccionada
  const handleViewDetails = (capacidad: CapacidadAdmin) => {
    setSelectedCapacidad(capacidad);
    setIsModalOpen(true);
  };

  // Cierra el modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCapacidad(null);
  };

  // --- Renderizado ---

  if (isLoading) return <p className="p-6 text-center text-neutral-600 animate-pulse">Cargando capacidades...</p>;
  if (error) return <p className="p-6 text-center text-red-600">⚠️ Error al cargar: {error}</p>;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Capacidades UNSA Registradas</h1>
        {/* Espacio para futuros filtros */}
      </div>

      {/* Grid o Mensaje de "vacío" */}
      {capacidades.length === 0 ? (
        <div className="border rounded-lg p-10 text-center bg-gray-50 mt-4">
            <p className="text-neutral-500">Aún no se han registrado capacidades.</p>
        </div>
      ) : (
        // Grid responsivo
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Mapea cada capacidad a su tarjeta */}
          {capacidades.map((capacidad) => (
            <CapacidadCard
              key={capacidad.capacidad_id}
              capacidad={capacidad}
              onViewDetails={() => handleViewDetails(capacidad)} // Pasa la función para abrir modal
            />
          ))}
        </div>
      )}

      {/* El Modal (solo se renderiza si hay una capacidad seleccionada) */}
      {selectedCapacidad && (
        <CapacidadDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal} // Pasa la función para cerrar
          capacidad={selectedCapacidad} // Pasa los datos
        />
      )}

      {/* Enlace opcional para volver */}
      <div className="pt-4">
        <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}