// /frontend/src/app/matchs/realizar/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Para saber el rol y ID del usuario
import { useMatchSettings } from '@/context/MatchSettingsContext';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Para mostrar palabras clave
import { ArrowRight, Send } from 'lucide-react'; // Iconos
// Importa los tipos para los resultados del matching (los que definiste en types/matching.ts)
import { CapacidadMatch, DesafioMatch } from '@/types/matching';
import Link from 'next/link'; // Asegúrate que Link está importado

// Define interfaces para los datos que esperamos (simplificadas por ahora)
interface MiDesafio {
    desafio_id: number;
    titulo: string;
    descripcion: string | null; // Puedes añadir más campos si los necesitas mostrar
    palabras_clave: string | null;
}

interface MiCapacidad {
    capacidad_id: number;
    descripcion_capacidad: string; // Usaremos esto como "título"
    // Puedes añadir más campos si los necesitas mostrar
    palabras_clave: string | null;
}

export default function RealizarMatchPage() {
    const { user } = useAuth(); // Obtiene el usuario logueado desde el contexto
    const { enabled, loading: settingsLoading } = useMatchSettings();
    const [misItems, setMisItems] = useState<(MiDesafio | MiCapacidad)[]>([]); // Estado para guardar desafíos o capacidades
    const [isLoading, setIsLoading] = useState(true); // Carga inicial de mis items
    const [error, setError] = useState<string | null>(null);
    // Estado para saber qué item ha seleccionado el usuario para buscarle match
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    // Estado para guardar las coincidencias encontradas
    const [potentialMatches, setPotentialMatches] = useState<(CapacidadMatch | DesafioMatch)[]>([]);
    // Estado para saber si estamos buscando coincidencias
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    // Estado para guardar el ID del item al que se le envió una solicitud (para feedback visual)
    const [requestedMatchId, setRequestedMatchId] = useState<number | null>(null);


    // Efecto para cargar los desafíos o capacidades del usuario al iniciar
    useEffect(() => {
        const fetchMisItems = async () => {
            if (!user || !enabled) return; // Si no hay usuario o sistema deshabilitado, no hacer nada

            setIsLoading(true);
            setError(null);
            const token = Cookies.get('token');
            // Determina qué endpoint llamar según el rol del usuario
            const endpoint = user.rol === 'externo'
                ? 'http://localhost:3001/api/desafios/mis-desafios'
                : 'http://localhost:3001/api/capacidades/mis-capacidades';

            try {
                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Error al cargar mis ${user.rol === 'externo' ? 'desafíos' : 'capacidades'}`);
                }
                const data = await res.json();
                setMisItems(data); // Guarda los items en el estado
            } catch (err: any) {
                console.error("Error fetching items:", err);
                setError(err.message);
                toast.error("Error al cargar", { description: err.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchMisItems();
    }, [user, enabled]); // Se ejecuta cada vez que 'user' o el estado del sistema cambie

    // Función actualizada para manejar la selección Y buscar coincidencias
    const handleSelectItem = async (id: number) => {
        if (!enabled) {
            toast.warning("El sistema de matchs está desactivado actualmente.");
            return;
        }
        setSelectedItemId(id); // Guarda el ID del item que el usuario seleccionó
        setPotentialMatches([]); // Limpia los resultados anteriores
        setRequestedMatchId(null); // Limpia el ID de solicitud enviada
        setIsLoadingMatches(true); // Empieza a mostrar que está cargando los matches
        setError(null); // Limpia errores anteriores
        const token = Cookies.get('token');

        if (!token || !user || !enabled) {
            toast.error("Error de autenticación");
            setIsLoadingMatches(false);
            return;
        }

        // Determina qué endpoint de la API de *matching* (búsqueda) usar
        const endpoint = user.rol === 'externo'
            ? `http://localhost:3001/api/matching/desafio/${id}` // Busca capacidades para este desafío
            : `http://localhost:3001/api/matching/capacidad/${id}`; // Busca desafíos para esta capacidad

        try {
            console.log(`Buscando coincidencias para ${user.rol} item ID ${id} en ${endpoint}`);
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                 if (res.status === 403) {
                     // Ajuste: Asumimos que hiciste el cambio en matching.routes.ts para permitir a usuarios buscar
                     // Si AÚN da 403, puede ser otro problema, pero el mensaje es más genérico.
                     throw new Error("Error al buscar coincidencias (verifique permisos o si el item existe).");
                 }
                throw new Error(errorData.message || 'Error al buscar coincidencias.');
            }

            const data = await res.json();
            console.log("Coincidencias encontradas:", data);
            setPotentialMatches(data); // Guarda las coincidencias encontradas

            if (data.length === 0) {
                toast.info("No se encontraron coincidencias directas basadas en palabras clave.");
            }

        } catch (err: any) {
            console.error("Error fetching matches:", err);
            setError(err.message); // Guarda el error para mostrarlo en la UI
            toast.error("Error al buscar coincidencias", { description: err.message });
        } finally {
            setIsLoadingMatches(false); // Termina de cargar (con éxito o error)
        }
    };

     // Función para enviar la solicitud de match al backend
    const handleRequestMatch = async (targetId: number) => {
        if (!user || !selectedItemId) return; // Necesitamos el usuario y el item seleccionado

        if (!enabled) {
            toast.warning("El sistema de matchs está desactivado actualmente.");
            return;
        }

        const token = Cookies.get('token');
        if (!token) {
            toast.error("Error de autenticación");
            return;
        }

        // Prepara los datos para enviar a la API POST /api/matches
        const bodyData = user.rol === 'externo'
            ? { desafio_id: selectedItemId, capacidad_id: targetId } // Externo seleccionó su desafío, target es la capacidad
            : { desafio_id: targetId, capacidad_id: selectedItemId }; // UNSA seleccionó su capacidad, target es el desafío

        setRequestedMatchId(targetId); // Marcar visualmente que se está enviando a este target
        toast.promise(
             fetch('http://localhost:3001/api/matches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            }).then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    // Si falla, reseteamos el ID solicitado para permitir reintentar
                    setRequestedMatchId(null);
                    throw new Error(data.message || 'Error al enviar la solicitud.');
                }
                // ¡Éxito! Mantenemos requestedMatchId para mostrar "Solicitud Enviada"
                return data; // Devuelve los datos para el mensaje de éxito del toast
            }),
            {
                loading: 'Enviando solicitud...',
                success: (data) => `Solicitud de match enviada correctamente (ID: ${data.matchId}).`,
                error: (err) => err.message, // Muestra el mensaje de error de la API
            }
        );
    };


    // Renderizado
    // Muestra carga inicial
    if (settingsLoading) {
        return <p>Verificando estado del sistema de matchs...</p>;
    }

    if (!enabled) {
        return (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-6 text-yellow-900">
                <h2 className="text-lg font-semibold">Sistema de matchs desactivado</h2>
                <p className="text-sm mt-2">Cuando un administrador active la opción “Iniciar Matchs” podrás buscar coincidencias y enviar solicitudes.</p>
            </div>
        );
    }
    if (isLoading) return <p>Cargando tus {user?.rol === 'externo' ? 'desafíos' : 'capacidades'}...</p>;
    // Muestra error de carga inicial (si lo hubo)
    // Nota: El error de búsqueda de matches se muestra más abajo
    if (error && misItems.length === 0) return <p className="text-red-500">Error al cargar tus registros: {error}</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">
                Realizar Match: {user?.rol === 'externo' ? 'Mis Desafíos' : 'Mis Capacidades'}
            </h1>
            <p className="text-neutral-600 mb-6">
                Selecciona uno de tus registros para buscar {user?.rol === 'externo' ? 'capacidades compatibles' : 'desafíos compatibles'}.
            </p>

            {/* Mensaje si no hay items propios */}
            {misItems.length === 0 ? (
                <p className="text-neutral-500 italic">
                    No tienes {user?.rol === 'externo' ? 'desafíos' : 'capacidades'} registrados.
                    {/* CORREGIDO: Comprobación user && antes del Link */}
                    {user && (
                        <Link href={user.rol === 'externo' ? '/desafio/registrar' : '/capacidad/registrar'} className="text-blue-600 hover:underline ml-2">
                            Registra uno aquí.
                        </Link>
                    )}
                </p>
            ) : (
                // Lista de items propios
                <div className="space-y-4">
                    {misItems.map(item => {
                        // Determina el ID basado en el tipo de item (desafío o capacidad)
                        const itemId = user?.rol === 'externo' ? (item as MiDesafio).desafio_id : (item as MiCapacidad).capacidad_id;
                        return (
                            <Card key={itemId} className={`border transition-all ${selectedItemId === itemId ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-gray-200 hover:shadow-sm'}`}>
                                <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {user?.rol === 'externo' ? (item as MiDesafio).titulo : (item as MiCapacidad).descripcion_capacidad.substring(0, 80) + '...'}
                                        </CardTitle>
                                        <CardDescription className="text-xs pt-1 line-clamp-2 max-w-lg">
                                            {user?.rol === 'externo' ? (item as MiDesafio).descripcion : ''}
                                            {item.palabras_clave && ` | Palabras clave: ${item.palabras_clave.split(',').slice(0, 3).join(', ')}${item.palabras_clave.split(',').length > 3 ? '...' : ''}`}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleSelectItem(itemId)}
                                        // Cambia el texto si es el item seleccionado actualmente
                                        variant={selectedItemId === itemId ? "secondary" : "default"}
                                        className="whitespace-nowrap" // Evita que el botón se parta en dos líneas
                                    >
                                        {selectedItemId === itemId ? 'Seleccionado' : 'Buscar Match'}
                                        {selectedItemId !== itemId && <ArrowRight className="w-4 h-4 ml-1"/>}
                                    </Button>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            )}

             {/* Sección para mostrar los resultados de la búsqueda de match */}
             {selectedItemId && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 border-t pt-6">
                        Posibles Coincidencias para {user?.rol === 'externo' ? 'tu Desafío' : 'tu Capacidad'}
                    </h2>
                    {/* Estado de carga de matches */}
                    {isLoadingMatches ? (
                        <p className="text-center text-neutral-500 animate-pulse">Buscando...</p>
                    /* Estado de error al buscar matches */
                    ) : error ? (
                         <p className="text-center text-red-500">⚠️ Error al buscar coincidencias: {error}</p>
                    /* Mensaje si no se encontraron matches */
                    ) : potentialMatches.length === 0 ? (
                        <p className="text-center text-neutral-500 italic">No se encontraron coincidencias basadas en palabras clave.</p>
                    ) : (
                        // Lista de matches encontrados
                        <div className="space-y-3">
                            {potentialMatches.map(match => {
                                const isCapacidadMatch = 'capacidad_id' in match;
                                const targetId = isCapacidadMatch ? (match as CapacidadMatch).capacidad_id : (match as DesafioMatch).desafio_id;
                                const title = isCapacidadMatch ? (match as CapacidadMatch).descripcion_capacidad.substring(0,100)+'...' : (match as DesafioMatch).titulo;
                                const subtitle = isCapacidadMatch ? `Investigador: ${(match as CapacidadMatch).investigador_nombre || 'N/A'}` : `Participante: ${(match as DesafioMatch).participante_nombre || 'N/A'} (${(match as DesafioMatch).organizacion || 'N/A'})`;
                                const keywords = match.palabras_coincidentes ? match.palabras_coincidentes.split(',').map(k => k.trim()) : [];

                                return (
                                    <Card key={targetId} className="border bg-white shadow-sm overflow-hidden">
                                        <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-3 pt-4 px-4">
                                            <div>
                                                <CardTitle className="text-base font-medium line-clamp-2">{title}</CardTitle>
                                                <CardDescription className="text-xs pt-1">{subtitle}</CardDescription>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={requestedMatchId === targetId ? "outline" : "default"} // Cambia a outline si ya se envió
                                                onClick={() => handleRequestMatch(targetId)}
                                                disabled={requestedMatchId !== null} // Deshabilita todos si ya se envió una
                                                className="text-xs h-8 whitespace-nowrap"
                                            >
                                                {requestedMatchId === targetId ? 'Solicitud Enviada ✓' : (
                                                    <>
                                                        Solicitar Match <Send className="w-3 h-3 ml-1"/>
                                                    </>
                                                )}
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-3">
                                            <div className="text-xs border-t pt-2">
                                                <span className="font-medium text-gray-700">Palabras Clave Coincidentes ({match.total_coincidencias}):</span>
                                                {keywords.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {keywords.map(kw => (
                                                            <Badge key={kw} variant="secondary" className="text-[10px] font-normal">{kw}</Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 italic ml-1">Ninguna</span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
             )}
        </div>
    );
}