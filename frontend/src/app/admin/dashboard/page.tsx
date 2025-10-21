// /frontend/src/app/admin/dashboard/page.tsx
"use client"; // Necesario para useState, useEffect, fetch

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // <-- Add this line

// Interfaces para tipar los datos
interface Desafio {
  desafio_id: number;
  titulo: string;
  participante_nombre: string;
  organizacion: string;
  fecha_creacion: string; // O Date si lo parseas
  palabras_clave: string | null;
}

interface KeywordStat {
  palabra: string;
  conteo_desafios: number;
}

export default function AdminDashboardPage() {
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [keywordStats, setKeywordStats] = useState<KeywordStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const token = Cookies.get('token');

      if (!token) {
        setError("No autenticado.");
        setIsLoading(false);
        // Podrías redirigir al login aquí
        return;
      }

      try {
        // Fetch Desafíos
        const desafiosRes = await fetch("http://localhost:3001/api/desafios", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!desafiosRes.ok) throw new Error(`Error ${desafiosRes.status}: No se pudieron cargar los desafíos.`);
        const desafiosData: Desafio[] = await desafiosRes.json();
        setDesafios(desafiosData);

        // Fetch Keyword Stats
        const statsRes = await fetch("http://localhost:3001/api/palabras-clave/stats", {
           headers: { "Authorization": `Bearer ${token}` }
        });
        if (!statsRes.ok) throw new Error(`Error ${statsRes.status}: No se pudieron cargar las estadísticas.`);
        const statsData: KeywordStat[] = await statsRes.json();
        setKeywordStats(statsData);

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Ocurrió un error al cargar los datos.");
        toast.error("Error al cargar datos", { description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900">
        Bienvenido al Dashboard
      </h1>
      <p className="text-neutral-600 mt-2">
        Resumen de la actividad en la plataforma.
      </p>

      {isLoading && <p className="mt-8 text-center">Cargando datos...</p>}
      {error && <p className="mt-8 text-center text-red-600">Error: {error}</p>}

      {!isLoading && !error && (
        <>
          {/* Resumen General */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold">Desafíos Registrados</h3>
              {/* Aquí podrías mostrar un conteo total si lo tuvieras */}
              <p className="text-4xl font-bold mt-2">{desafios.length}</p>
            </div>
             <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold">Palabras Clave Populares</h3>
              {/* Mostramos la palabra más popular y su conteo */}
              <p className="text-xl font-bold mt-2 truncate">
                  {keywordStats.length > 0 ? keywordStats[0].palabra : '-'}
              </p>
               <p className="text-sm text-neutral-500">
                   {keywordStats.length > 0 ? `(${keywordStats[0].conteo_desafios} desafíos)` : '(No hay datos)'}
               </p>
            </div>
             <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold">Capacidades UNSA</h3>
              <p className="text-4xl font-bold mt-2">0</p> {/* Actualizar cuando tengas datos de capacidades */}
            </div>
          </div>

           {/* Tabla de Últimos Desafíos */}
           <div className="mt-12 bg-white p-6 rounded-lg border">
               <h2 className="text-xl font-semibold mb-4">Últimos Desafíos Registrados</h2>
               {desafios.length === 0 ? (
                    <p className="text-neutral-500">No hay desafíos registrados aún.</p>
               ) : (
                <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-neutral-200">
                       <thead className="bg-neutral-50">
                           <tr>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Título</th>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Participante</th>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Organización</th>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Palabras Clave</th>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Fecha</th>
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-neutral-200">
                           {desafios.slice(0, 5).map((desafio) => ( // Mostrar solo los últimos 5
                               <tr key={desafio.desafio_id}>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{desafio.titulo}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{desafio.participante_nombre}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{desafio.organizacion || '-'}</td>
                                   <td className="px-6 py-4 text-sm text-neutral-500 max-w-xs truncate">{desafio.palabras_clave || '-'}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{new Date(desafio.fecha_creacion).toLocaleDateString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
                </div>
               )}
                {/* Podrías añadir un enlace a "/admin/desafios" para ver todos */}
                {desafios.length > 5 && (
                    <div className="mt-4">
                        <Button variant="link" size="sm">Ver todos los desafíos...</Button>
                    </div>
                )}
           </div>

           {/* Lista de Palabras Clave Populares */}
           <div className="mt-8 bg-white p-6 rounded-lg border">
               <h2 className="text-xl font-semibold mb-4">Palabras Clave Más Utilizadas en Desafíos</h2>
                {keywordStats.length === 0 ? (
                    <p className="text-neutral-500">No hay datos de palabras clave.</p>
                ) : (
                    <ul className="space-y-2">
                        {keywordStats.map((stat) => (
                            <li key={stat.palabra} className="flex justify-between items-center text-sm">
                                <span className="text-neutral-700">{stat.palabra}</span>
                                <span className="font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                                    {stat.conteo_desafios} {stat.conteo_desafios === 1 ? 'desafío' : 'desafíos'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
           </div>
        </>
      )}
    </div>
  );
}