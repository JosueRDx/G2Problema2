// /frontend/src/app/admin/matching/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DesafioAdmin } from '@/types/desafio';
import { CapacidadAdmin } from '@/types/capacidad';
import { CapacidadMatch, DesafioMatch } from '@/types/matching';
import { MatchRecord } from '@/types/match';
import { ArrowDownUp, Info, Power, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type SearchType = 'desafio' | 'capacidad';
type SortOrder = 'desc' | 'asc';

const safeSubstring = (text: string | null | undefined, start: number, end?: number, fallback: string = '...') => {
    if (typeof text === 'string') {
        const sub = end !== undefined ? text.substring(start, end) : text.substring(start);
        return text.length > (end ?? text.length) ? sub + '...' : sub;
    }
    return fallback;
};

export default function MatchingAdminPage() {
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<SearchType>('desafio');
  const [allItems, setAllItems] = useState<(DesafioAdmin | CapacidadAdmin)[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [matches, setMatches] = useState<(CapacidadMatch | DesafioMatch)[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [mostFrequentKeyword, setMostFrequentKeyword] = useState<string | null>(null);
  const [matchSystemEnabled, setMatchSystemEnabled] = useState(false);
  const [isLoadingMatchSettings, setIsLoadingMatchSettings] = useState(false);
  const [isUpdatingMatchSettings, setIsUpdatingMatchSettings] = useState(false);
  const [adminMatches, setAdminMatches] = useState<MatchRecord[]>([]);
  const [isLoadingAdminMatches, setIsLoadingAdminMatches] = useState(false);


  const token = Cookies.get('token');

    const fetchMatchSystemStatus = useCallback(async () => {
    if (!token) {
      toast.error("Error de autenticación");
      return;
    }
    setIsLoadingMatchSettings(true);
    try {
      const response = await fetch("http://localhost:3001/api/matches/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo obtener el estado del sistema de matchs.");
      }
      setMatchSystemEnabled(Boolean(data.enabled));
    } catch (error: any) {
      console.error("Error al obtener estado del sistema de matchs:", error);
      setMatchSystemEnabled(false);
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoadingMatchSettings(false);
    }
  }, [token]);

  const fetchAdminMatches = useCallback(async () => {
    if (!token) {
      toast.error("Error de autenticación");
      return;
    }
    setIsLoadingAdminMatches(true);
    try {
      const response = await fetch("http://localhost:3001/api/matches/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudieron obtener los matchs realizados.");
      }
      setAdminMatches(data);
    } catch (error: any) {
      console.error("Error al obtener matchs del administrador:", error);
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoadingAdminMatches(false);
    }
  }, [token]);

  // --- useEffects y calculateMostFrequentKeyword (sin cambios) ---
  useEffect(() => {
    const fetchItems = async () => {
      if (!token) { setError("No autenticado."); toast.error("Error de autenticación"); return; }
      setIsLoadingItems(true); setError(null); setAllItems([]); setSelectedItemId(''); setMatches([]); setMostFrequentKeyword(null);
      const endpoint = searchType === 'desafio' ? "http://localhost:3001/api/desafios" : "http://localhost:3001/api/capacidades";
      try {
        const res = await fetch(endpoint, { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) { throw new Error(`Error al cargar ${searchType === 'desafio' ? 'desafíos' : 'capacidades'}`); }
        const data = await res.json();
        // --- FILTRO ADICIONAL ---
        // Filtra items que no tengan un ID válido antes de guardarlos
        const validItems = data.filter((item: any) =>
            (searchType === 'desafio' && item?.desafio_id != null) ||
            (searchType === 'capacidad' && item?.capacidad_id != null)
        );
        setAllItems(validItems);
      } catch (err: any) { setError(err.message); toast.error("Error", { description: err.message });
      } finally { setIsLoadingItems(false); }
    };
    fetchItems();
  }, [searchType, token]);

  useEffect(() => {
    fetchMatchSystemStatus();
    fetchAdminMatches();
  }, [fetchMatchSystemStatus, fetchAdminMatches]);

  const calculateMostFrequentKeyword = (currentMatches: (CapacidadMatch | DesafioMatch)[]) => {
      if (!currentMatches || currentMatches.length === 0) { setMostFrequentKeyword(null); return; }
      const keywordCounts: { [key: string]: number } = {}; let maxCount = 0; let frequentKeyword: string | null = null;
      currentMatches.forEach(match => {
          if (match.palabras_coincidentes) {
              const keywords = match.palabras_coincidentes.split(',').map(k => k.trim()).filter(k => k);
              keywords.forEach(kw => {
                  keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
                  if (keywordCounts[kw] > maxCount) { maxCount = keywordCounts[kw]; frequentKeyword = kw;
                  } else if (keywordCounts[kw] === maxCount && kw !== frequentKeyword) { frequentKeyword = kw; }
              });
          }
      });
      setMostFrequentKeyword(frequentKeyword);
  };

   useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedItemId || !token) { setMatches([]); setMostFrequentKeyword(null); return; }
      setIsLoadingMatches(true); setError(null);
      const matchEndpoint = searchType === 'desafio' ? `http://localhost:3001/api/matches/desafio/${selectedItemId}` : `http://localhost:3001/api/matches/capacidad/${selectedItemId}`;
      try {
        const res = await fetch(matchEndpoint, { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) { throw new Error(`Error al buscar coincidencias`); }
        const data = await res.json();
        // --- FILTRO ADICIONAL ---
        // Filtra matches que no tengan un ID válido antes de guardarlos
        const validMatches = data.filter((match: any) =>
            (searchType === 'desafio' && match?.capacidad_id != null) || // Si buscamos por desafío, el match debe tener capacidad_id
            (searchType === 'capacidad' && match?.desafio_id != null) // Si buscamos por capacidad, el match debe tener desafio_id
        );
        setMatches(validMatches);
        calculateMostFrequentKeyword(validMatches); // Usa los matches filtrados
      } catch (err: any) { setError(err.message); setMatches([]); setMostFrequentKeyword(null); toast.error("Error", { description: err.message });
      } finally { setIsLoadingMatches(false); }
    };
    fetchMatches();
   }, [selectedItemId, searchType, token]);

  const sortedMatches = useMemo(() => {
    const sorted = [...matches];
    sorted.sort((a, b) => { const diff = b.total_coincidencias - a.total_coincidencias; return sortOrder === 'asc' ? -diff : diff; });
    return sorted;
  }, [matches, sortOrder]);

  const handleSearchTypeChange = (value: string) => { setSearchType(value as SearchType); };
  const handleItemSelectChange = (value: string) => { setSelectedItemId(value); };
  const toggleSortOrder = () => { setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc')); };

   const selectedItemDetails = useMemo(() => {
    if (!selectedItemId) return null;
    return allItems.find(item =>
        (searchType === 'desafio' && (item as DesafioAdmin).desafio_id === parseInt(selectedItemId)) ||
        (searchType === 'capacidad' && (item as CapacidadAdmin).capacidad_id === parseInt(selectedItemId))
    );
  }, [selectedItemId, allItems, searchType]);

  const handleToggleMatchSystem = async () => {
    if (!token) {
      toast.error("Error de autenticación");
      return;
    }
    setIsUpdatingMatchSettings(true);
    try {
      const response = await fetch("http://localhost:3001/api/matches/settings", {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !matchSystemEnabled }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo actualizar el estado del sistema de matchs.');
      }
      setMatchSystemEnabled(Boolean(data.enabled));
      toast.success(data.message || (data.enabled ? 'Sistema de matchs activado.' : 'Sistema de matchs desactivado.'));
      fetchAdminMatches();
    } catch (error: any) {
      console.error('Error al actualizar el sistema de matchs:', error);
      toast.error('Error', { description: error.message });
    } finally {
      setIsUpdatingMatchSettings(false);
    }
  };

  // --- Renderizado ---
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Emparejamiento (Matching)</h1>
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle>Control general del sistema</CardTitle>
          <CardDescription>
            Habilita o deshabilita el flujo de solicitudes, aceptación de matchs y chats entre participantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-neutral-700">
          {isLoadingMatchSettings ? (
            <p>Verificando estado actual...</p>
          ) : (
            <p>
              Estado: <span className={`font-semibold ${matchSystemEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {matchSystemEnabled ? 'Activo' : 'Inactivo'}
              </span>
            </p>
          )}
          <p className="text-xs text-neutral-500">
            Cuando el sistema está inactivo, los usuarios no pueden enviar solicitudes ni chatear sobre matchs existentes.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button
            onClick={handleToggleMatchSystem}
            disabled={isLoadingMatchSettings || isUpdatingMatchSettings}
            variant={matchSystemEnabled ? 'destructive' : 'default'}
          >
            <Power className="w-4 h-4 mr-2" /> {matchSystemEnabled ? 'Detener Matchs' : 'Iniciar Matchs'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchMatchSystemStatus();
              fetchAdminMatches();
            }}
            disabled={isLoadingMatchSettings || isLoadingAdminMatches}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar información
          </Button>
        </CardFooter>
      </Card>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Selección de Tipo */}
        <div className="flex-1">
            <label htmlFor="searchTypeSelect" className="block text-sm font-medium text-gray-700 mb-1">Buscar coincidencias para:</label>
              <Select value={searchType} onValueChange={handleSearchTypeChange}>
                <SelectTrigger id="searchTypeSelect"><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                <SelectContent><SelectItem value="desafio">Un Desafío</SelectItem><SelectItem value="capacidad">Una Capacidad</SelectItem></SelectContent>
              </Select>
        </div>
        {/* Selección del Item Específico */}
        <div className="flex-1">
            <label htmlFor="itemSelect" className="block text-sm font-medium text-gray-700 mb-1">Seleccionar {searchType === 'desafio' ? 'Desafío' : 'Capacidad'}:</label>
              <Select value={selectedItemId} onValueChange={handleItemSelectChange} disabled={isLoadingItems || allItems.length === 0}>
                <SelectTrigger id="itemSelect" className="w-full"><SelectValue placeholder={isLoadingItems ? "Cargando..." : `Seleccionar ${searchType === 'desafio' ? 'desafío' : 'capacidad'}...`} /></SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  {allItems.map(item => {
                    // Obtenemos el ID de forma segura, asegurándonos de que no sea null/undefined
                    const id = searchType === 'desafio'
                        ? (item as DesafioAdmin)?.desafio_id
                        : (item as CapacidadAdmin)?.capacidad_id;

                    // Si no hay ID, no renderizamos este item (evita key undefined)
                    if (id == null) return null;

                    const text = searchType === 'desafio'
                        ? (item as DesafioAdmin).titulo
                        : safeSubstring((item as CapacidadAdmin).descripcion_capacidad, 0, 80, 'Capacidad sin descripción');

                    return (
                        <SelectItem key={String(id)} value={String(id)}>
                            <span className="truncate">{text || `ID: ${id}`}</span> {/* Texto alternativo si text es vacío */}
                        </SelectItem>
                    );
                   })}
                </SelectContent>
              </Select>
        </div>
      </div>
      {/* Área de Resultados */}
      {selectedItemId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Columna Izquierda */}
          <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold mb-2 text-neutral-800">{searchType === 'desafio' ? 'Desafío Seleccionado' : 'Capacidad Seleccionada'}</h2>
                {selectedItemDetails ? (
                   <Card className="border border-blue-200 bg-blue-50/50 shadow-sm">
                    <CardHeader><CardTitle className="text-base">{searchType === 'desafio' ? (selectedItemDetails as DesafioAdmin).titulo : safeSubstring((selectedItemDetails as CapacidadAdmin).descripcion_capacidad, 0, 150, 'Sin descripción')}</CardTitle><CardDescription className="text-xs pt-1">{searchType === 'desafio' ? `Por: ${(selectedItemDetails as DesafioAdmin).participante_nombre || 'N/A'} (${(selectedItemDetails as DesafioAdmin).organizacion || 'N/A'})` : `Investigador: ${(selectedItemDetails as CapacidadAdmin).investigador_nombre || 'N/A'}`}</CardDescription></CardHeader>
                    <CardContent className="text-xs"><p className="font-medium">Palabras Clave Originales:</p><p className="text-gray-600 italic break-words">{searchType === 'desafio' ? (selectedItemDetails as DesafioAdmin).palabras_clave || 'Ninguna' : (selectedItemDetails as CapacidadAdmin).palabras_clave || 'Ninguna'}</p></CardContent>
                   </Card>
                ) : ( <p className="text-neutral-500 italic">Cargando detalles...</p> )}
                {mostFrequentKeyword && !isLoadingMatches && ( <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm"><p className="flex items-center gap-1"><Info className="w-4 h-4 text-yellow-700"/><span className="font-semibold text-yellow-800">Palabra Clave Más Coincidente:</span></p><p className="ml-5 text-yellow-900">{mostFrequentKeyword}</p></div> )}
          </div>
          {/* Columna Derecha */}
          <div className="lg:col-span-2">
                 <div className="flex justify-between items-center mb-2"><h2 className="text-lg font-semibold text-neutral-800">{searchType === 'desafio' ? 'Capacidades Coincidentes' : 'Desafíos Coincidentes'} ({matches.length})</h2><Button variant="outline" size="sm" onClick={toggleSortOrder} disabled={isLoadingMatches || matches.length < 2}><ArrowDownUp className="w-3 h-3 mr-1"/>Ordenar: {sortOrder === 'desc' ? 'Más relevantes primero' : 'Menos relevantes primero'}</Button></div>
                 {isLoadingMatches ? ( <p className="text-center p-4 text-neutral-500 animate-pulse">Buscando coincidencias...</p>
                 ) : error ? ( <p className="text-center p-4 text-red-600">⚠️ Error: {error}</p>
                 ) : sortedMatches.length === 0 ? ( <p className="text-center p-4 text-neutral-500">No se encontraron coincidencias.</p>
                 ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 border rounded-lg p-3 bg-gray-50/70">
                        {sortedMatches.map(match => {
                             // Obtenemos el ID de forma segura
                             const id = searchType === 'desafio'
                                ? (match as CapacidadMatch)?.capacidad_id
                                : (match as DesafioMatch)?.desafio_id;

                             // Si no hay ID, no renderizamos este match (evita key undefined)
                             if (id == null) return null;

                             const title = searchType === 'desafio' ? safeSubstring((match as CapacidadMatch).descripcion_capacidad, 0, 100, 'Sin descripción') : (match as DesafioMatch).titulo;
                             const subtitle = searchType === 'desafio' ? `Investigador: ${(match as CapacidadMatch).investigador_nombre || 'N/A'}` : `Participante: ${(match as DesafioMatch).participante_nombre || 'N/A'} (${(match as DesafioMatch).organizacion || 'N/A'})`;
                            return (
                                <div key={String(id)} className="border bg-white p-3 rounded-md shadow-sm text-xs transition-shadow hover:shadow-md">
                                    <p className="font-semibold text-sm mb-1 line-clamp-2">{title || `ID: ${id}`}</p> {/* Texto alternativo */}
                                    <p className="text-gray-600 mb-2">{subtitle}</p>
                                    <div className="mt-1 border-t pt-2">
                                        <span className="font-medium text-[11px] text-gray-700">{match.total_coincidencias} Palabra(s) Clave Coincidentes:</span>
                                        <p className="text-gray-500 italic text-[10px] break-words">{match.palabras_coincidentes}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 )}
          </div>
        </div>
      )}
       <div className="pt-4"><Link href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Volver al Dashboard</Link></div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-800">Matchs realizados ({adminMatches.length})</h2>
        {isLoadingAdminMatches ? (
          <p className="text-sm text-neutral-500">Cargando historial de matchs...</p>
        ) : adminMatches.length === 0 ? (
          <p className="text-sm text-neutral-500">Aún no existen matchs registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Desafío</th>
                  <th className="px-4 py-2 text-left">Capacidad</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Actualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {adminMatches.map((match) => (
                  <tr key={match.match_id} className="bg-white">
                    <td className="px-4 py-2 font-medium text-neutral-800">#{match.match_id}</td>
                    <td className="px-4 py-2">
                      <p className="font-semibold text-neutral-800">{match.desafio_titulo || `ID ${match.desafio_id}`}</p>
                      <p className="text-xs text-neutral-500">{match.desafio_participante_nombre || 'Participante externo'}</p>
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-semibold text-neutral-800">{match.capacidad_desc_corta || `ID ${match.capacidad_id}`}</p>
                      <p className="text-xs text-neutral-500">{match.capacidad_investigador_nombre || 'Investigador UNSA'}</p>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={match.estado === 'aceptado' ? 'default' : match.estado.startsWith('rechazado') ? 'destructive' : 'secondary'}>
                        {match.estado.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-neutral-500">{new Date(match.fecha_actualizacion).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}