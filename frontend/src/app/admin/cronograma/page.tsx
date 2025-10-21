// /frontend/src/app/admin/cronograma/page.tsx
"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
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

export default function AdminCronogramaPage() {
    const [dias, setDias] = useState<DiaEvento[]>([]);
    const [sesiones, setSesiones] = useState<SesionEvento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para formularios (simplificado, idealmente usar react-hook-form)
    const [newDia, setNewDia] = useState({ dia_numero: '', nombre_dia: '', fecha: '' });
    const [newSesion, setNewSesion] = useState({ dia_id: '', horario_display: '', hora_inicio: '', hora_fin: '', bloque_tematico: '', foco_objetivos: '', entregable_clave: '' });

    const token = Cookies.get('token'); // Obtener token una vez

    const fetchData = async () => {
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

        } catch (err: any) {
            setError(err.message);
            toast.error("Error", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Dependencia vacía para ejecutar solo al montar

    // --- Handlers para Formularios (simplificados) ---
    const handleDiaChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewDia(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSesionChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
         setNewSesion(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreateDia = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            const res = await fetch("http://localhost:3001/api/cronograma/admin/dias", {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    dia_numero: parseInt(newDia.dia_numero),
                    nombre_dia: newDia.nombre_dia,
                    fecha: newDia.fecha
                })
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message) || 'Error al crear día');
            toast.success("Día creado");
            setNewDia({ dia_numero: '', nombre_dia: '', fecha: '' }); // Reset form
            fetchData(); // Recargar datos
        } catch (err: any) {
            toast.error("Error al crear día", { description: err.message });
        }
    };

     const handleCreateSesion = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            const res = await fetch("http://localhost:3001/api/cronograma/admin/sesiones", {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newSesion,
                    dia_id: parseInt(newSesion.dia_id),
                    // Convierte a null si están vacíos
                    hora_inicio: newSesion.hora_inicio || null,
                    hora_fin: newSesion.hora_fin || null,
                    foco_objetivos: newSesion.foco_objetivos || null,
                    entregable_clave: newSesion.entregable_clave || null,
                })
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.message) || 'Error al crear sesión');
            toast.success("Sesión creada");
            setNewSesion({ dia_id: '', horario_display: '', hora_inicio: '', hora_fin: '', bloque_tematico: '', foco_objetivos: '', entregable_clave: '' }); // Reset form
            fetchData(); // Recargar datos
        } catch (err: any) {
            toast.error("Error al crear sesión", { description: err.message });
        }
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
            fetchData(); // Recargar
        } catch (err: any) {
            toast.error("Error al eliminar día", { description: err.message });
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
            fetchData(); // Recargar
        } catch (err: any) {
            toast.error("Error al eliminar sesión", { description: err.message });
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
                    <form onSubmit={handleCreateDia} className="mb-6 p-4 border rounded grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                        <Button type="submit">Añadir Día</Button>
                    </form>

                    {/* Tabla de Días */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead><tr><th>#</th><th>Nombre</th><th>Fecha</th><th>Acciones</th></tr></thead>
                            <tbody className="divide-y divide-gray-200">
                                {dias.map(d => (
                                    <tr key={d.dia_id}>
                                        <td>{d.dia_numero}</td>
                                        <td>{d.nombre_dia}</td>
                                        <td>{new Date(d.fecha + 'T00:00:00').toLocaleDateString()}</td>
                                        <td>
                                            <Button variant="ghost" size="sm" onClick={() => {/* Lógica Editar Día */}}> <Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDia(d.dia_id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
                    <form onSubmit={handleCreateSesion} className="mb-6 p-4 border rounded space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="dia_id_sesion">Día *</Label>
                                <select id="dia_id_sesion" name="dia_id" value={newSesion.dia_id} onChange={(e) => setNewSesion(p=>({...p, dia_id: e.target.value}))} required className="border rounded p-2 w-full">
                                    <option value="">Selecciona...</option>
                                    {dias.map(d => <option key={d.dia_id} value={d.dia_id}>{d.nombre_dia} ({new Date(d.fecha+'T00:00:00').toLocaleDateString()})</option>)}
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
                        <Button type="submit">Añadir Sesión</Button>
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
                                            <Button variant="ghost" size="sm" onClick={() => {/* Lógica Editar Sesión */}}> <Edit className="h-4 w-4" /></Button>
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