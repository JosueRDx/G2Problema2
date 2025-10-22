// /frontend/src/app/admin/matching/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DesafioAdmin } from '@/types/desafio';
import { CapacidadAdmin } from '@/types/capacidad';
import { CapacidadMatch, DesafioMatch } from '@/types/matching';
import { ArrowDownUp, Info } from 'lucide-react';
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

  const token = Cookies.get('token');

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

  // --- Renderizado ---
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Emparejamiento (Matching)</h1>
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
    </div>
  );
}