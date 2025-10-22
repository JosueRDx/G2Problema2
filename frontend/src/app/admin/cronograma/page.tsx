// /frontend/src/app/admin/cronograma/page.tsx
"use client";

import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Asegúrate que la importación es correcta
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react';

// Reutiliza o define las interfaces si no las importas
interface DiaEvento {
    dia_id: number;
    dia_numero: number;
    nombre_dia: string;
    fecha: string; // Formato YYYY-MM-DD
}

interface SesionEvento {
    sesion_id: number;
    dia_id: number;
    horario_display: string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    bloque_tematico: string;
    foco_objetivos?: string | null;
    entregable_clave?: string | null;
    nombre_dia?: string; // Para mostrar en la tabla admin
}

const DIA_FORM_DEFAULT = { dia_numero: '', nombre_dia: '', fecha: '' };
const SESION_FORM_DEFAULT = {
    dia_id: '',
    horario_display: '',
    hora_inicio: '',
    hora_fin: '',
    bloque_tematico: '',
    foco_objetivos: '',
    entregable_clave: ''
};

const getISODate = (value?: string | null | Date): string => {
    if (!value) return '';
    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }
    const stringValue = value.toString();
    return stringValue.includes('T') ? stringValue.split('T')[0] : stringValue;
};

const formatDateForDisplay = (value?: string | null | Date): string => {
    const iso = getISODate(value);
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const [year, month, day] = parts.map(part => Number(part));
    if (!year || !month || !day) return iso;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString();
};

const toTimeInputValue = (value?: string | null): string => {
    if (!value) return '';
    const [hours = '', minutes = ''] = value.split(':');
    if (!hours) return '';
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Error inesperado';
};

export default function AdminCronogramaPage() {
    const [dias, setDias] = useState<DiaEvento[]>([]);
    const [sesiones, setSesiones] = useState<SesionEvento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para formularios (simplificado, idealmente usar react-hook-form)
    const [newDia, setNewDia] = useState({ ...DIA_FORM_DEFAULT });
    const [newSesion, setNewSesion] = useState({ ...SESION_FORM_DEFAULT });
    const [editingDiaId, setEditingDiaId] = useState<number | null>(null);
    const [editingSesionId, setEditingSesionId] = useState<number | null>(null);

    const token = Cookies.get('token'); // Obtener token una vez

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        if (!token) {
            setError("No autenticado.");
            setIsLoading(false);
            return;
        }
        try {
            const [diasRes, sesionesRes] = await Promise.all([
                fetch("http://localhost:3001/api/cronograma/admin/dias", { headers: { "Authorization": `Bearer ${token}` } }),
                fetch("http://localhost:3001/api/cronograma/admin/sesiones", { headers: { "Authorization": `Bearer ${token}` } })
            ]);

            if (!diasRes.ok) throw new Error('Error al cargar días');
            if (!sesionesRes.ok) throw new Error('Error al cargar sesiones');

            setDias(await diasRes.json());
            setSesiones(await sesionesRes.json());

        } catch (error: unknown) {
            const message = getErrorMessage(error);
            setError(message);
            toast.error("Error", { description: message });
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers para Formularios (simplificados) ---
    const resetDiaForm = () => {
        setNewDia({ ...DIA_FORM_DEFAULT });
        setEditingDiaId(null);
    };

    const resetSesionForm = () => {
        setNewSesion({ ...SESION_FORM_DEFAULT });
        setEditingSesionId(null);
    };

    const handleDiaChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewDia(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSesionChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
         setNewSesion(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDiaSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast.error("Sesión expirada", { description: "Inicia sesión nuevamente para continuar." });
            return;
        }

        const diaNumero = parseInt(newDia.dia_numero, 10);
        if (Number.isNaN(diaNumero)) {
            toast.error("Número de día inválido");
            return;
        }
        try {
            const endpoint = editingDiaId
                ? `http://localhost:3001/api/cronograma/admin/dias/${editingDiaId}`
                : "http://localhost:3001/api/cronograma/admin/dias";
            const method = editingDiaId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    dia_numero: diaNumero,
                    nombre_dia: newDia.nombre_dia,
                    fecha: newDia.fecha
                })
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message) || 'Error al guardar día');

            toast.success(editingDiaId ? "Día actualizado" : "Día creado");
            resetDiaForm();
            fetchData();
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            toast.error("Error", { description: message });
        }
    };

    const startEditDia = (dia: DiaEvento) => {
        setEditingDiaId(dia.dia_id);
        setNewDia({
            dia_numero: dia.dia_numero.toString(),
            nombre_dia: dia.nombre_dia,
            fecha: getISODate(dia.fecha)
        });
    };

    const handleSesionSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast.error("Sesión expirada", { description: "Inicia sesión nuevamente para continuar." });
            return;
        }

        const diaId = parseInt(newSesion.dia_id, 10);
        if (Number.isNaN(diaId)) {
            toast.error("Selecciona un día válido para la sesión");
            return;
        }
        try {
            const endpoint = editingSesionId
                ? `http://localhost:3001/api/cronograma/admin/sesiones/${editingSesionId}`
                : "http://localhost:3001/api/cronograma/admin/sesiones";
            const method = editingSesionId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newSesion,
                    dia_id: diaId,
                    hora_inicio: newSesion.hora_inicio || null,
                    hora_fin: newSesion.hora_fin || null,
                    foco_objetivos: newSesion.foco_objetivos || null,
                    entregable_clave: newSesion.entregable_clave || null,
                })
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message) || 'Error al guardar sesión');

            toast.success(editingSesionId ? "Sesión actualizada" : "Sesión creada");
            resetSesionForm();
            fetchData();
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            toast.error("Error", { description: message });
        }
    };

    const startEditSesion = (sesion: SesionEvento) => {
        setEditingSesionId(sesion.sesion_id);
        setNewSesion({
            dia_id: sesion.dia_id.toString(),
            horario_display: sesion.horario_display,
            hora_inicio: toTimeInputValue(sesion.hora_inicio),
            hora_fin: toTimeInputValue(sesion.hora_fin),
            bloque_tematico: sesion.bloque_tematico,
            foco_objetivos: sesion.foco_objetivos || '',
            entregable_clave: sesion.entregable_clave || ''
        });
    };

    const handleDeleteDia = async (id: number) => {
        if (!token || !confirm("¿Seguro que quieres eliminar este día y todas sus sesiones?")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/cronograma/admin/dias/${id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message) || 'Error al eliminar día');
            toast.success("Día eliminado");
            if (editingDiaId === id) {
                resetDiaForm();
            }
            fetchData();
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            toast.error("Error al eliminar día", { description: message });
        }
    };

    const handleDeleteSesion = async (id: number) => {
        if (!token || !confirm("¿Seguro que quieres eliminar esta sesión?")) return;
         try {
            const res = await fetch(`http://localhost:3001/api/cronograma/admin/sesiones/${id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message) || 'Error al eliminar sesión');
            toast.success("Sesión eliminada");
            if (editingSesionId === id) {
                resetSesionForm();
            }
            fetchData();
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            toast.error("Error al eliminar sesión", { description: message });
        }
    };


    // --- Renderizado ---
    if (isLoading) return <p>Cargando cronograma...</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Gestionar Cronograma</h1>

            {/* Sección Días */}
            <Card>
                <CardHeader>
                    <CardTitle>Días del Evento</CardTitle>
                    <CardDescription>Añade o modifica los días principales.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Formulario Crear Día */}
                    <form onSubmit={handleDiaSubmit} className="mb-6 p-4 border rounded grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <Label htmlFor="dia_numero">Número</Label>
                            <Input type="number" id="dia_numero" name="dia_numero" value={newDia.dia_numero} onChange={handleDiaChange} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="nombre_dia">Nombre</Label>
                            <Input id="nombre_dia" name="nombre_dia" value={newDia.nombre_dia} onChange={handleDiaChange} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="fecha">Fecha</Label>
                            <Input type="date" id="fecha" name="fecha" value={newDia.fecha} onChange={handleDiaChange} required />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">{editingDiaId ? 'Guardar cambios' : 'Añadir Día'}</Button>
                            {editingDiaId && (
                                <Button type="button" variant="outline" onClick={resetDiaForm}>Cancelar</Button>
                            )}
                        </div>
                    </form>

                    {/* Tabla de Días */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-600 w-20">#</th>
                                    <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-600">Nombre</th>
                                    <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-600">Fecha</th>
                                    <th scope="col" className="px-4 py-2 text-right font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dias.map(d => (
                                    <tr key={d.dia_id}>
                                          <td className="px-4 py-2 text-gray-900">{d.dia_numero}</td>
                                        <td className="px-4 py-2 text-gray-900">{d.nombre_dia}</td>
                                        <td className="px-4 py-2 text-gray-900">{formatDateForDisplay(d.fecha)}</td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => startEditDia(d)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteDia(d.dia_id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Sección Sesiones */}
             <Card>
                <CardHeader>
                    <CardTitle>Sesiones del Evento</CardTitle>
                    <CardDescription>Añade o modifica las sesiones dentro de cada día.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Formulario Crear Sesión */}
                    <form onSubmit={handleSesionSubmit} className="mb-6 p-4 border rounded space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="dia_id_sesion">Día *</Label>
                                <select id="dia_id_sesion" name="dia_id" value={newSesion.dia_id} onChange={(e) => setNewSesion(p=>({...p, dia_id: e.target.value}))} required className="border rounded p-2 w-full">
                                    <option value="">Selecciona...</option>
                                    {dias.map(d => (
                                        <option key={d.dia_id} value={d.dia_id}>
                                            {d.nombre_dia} ({formatDateForDisplay(d.fecha)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="horario_display">Horario (Texto) *</Label>
                                <Input id="horario_display" name="horario_display" value={newSesion.horario_display} onChange={handleSesionChange} placeholder="Ej: 09:00 - 11:00" required />
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="hora_inicio">Hora Inicio (Opc)</Label>
                                <Input type="time" id="hora_inicio" name="hora_inicio" value={newSesion.hora_inicio} onChange={handleSesionChange} />
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="hora_fin">Hora Fin (Opc)</Label>
                                <Input type="time" id="hora_fin" name="hora_fin" value={newSesion.hora_fin} onChange={handleSesionChange} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="bloque_tematico">Bloque Temático *</Label>
                            <Textarea id="bloque_tematico" name="bloque_tematico" value={newSesion.bloque_tematico} onChange={handleSesionChange} required rows={2} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label htmlFor="foco_objetivos">Foco / Objetivos</Label>
                                <Textarea id="foco_objetivos" name="foco_objetivos" value={newSesion.foco_objetivos} onChange={handleSesionChange} rows={3} />
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="entregable_clave">Entregable Clave</Label>
                                <Textarea id="entregable_clave" name="entregable_clave" value={newSesion.entregable_clave} onChange={handleSesionChange} rows={3} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">{editingSesionId ? 'Guardar cambios' : 'Añadir Sesión'}</Button>
                            {editingSesionId && (
                                <Button type="button" variant="outline" onClick={resetSesionForm}>Cancelar</Button>
                            )}
                        </div>
                    </form>

                     {/* Tabla de Sesiones */}
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                             <thead><tr><th>Día</th><th>Horario</th><th>Bloque</th><th>Acciones</th></tr></thead>
                             <tbody className="divide-y divide-gray-200">
                                {sesiones.map(s => (
                                    <tr key={s.sesion_id}>
                                        <td>{s.nombre_dia}</td>
                                        <td>{s.horario_display}</td>
                                        <td className="max-w-md truncate">{s.bloque_tematico}</td>
                                        <td>
                                            <Button variant="ghost" size="sm" onClick={() => startEditSesion(s)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSesion(s.sesion_id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                     </div>
                </CardContent>
            </Card>

        </div>
    );
}