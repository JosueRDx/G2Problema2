// /frontend/src/app/agenda/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Reutiliza o define las interfaces aquí también
interface SesionEvento {
    sesion_id: number;
    horario_display: string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    bloque_tematico: string;
    foco_objetivos?: string | null;
    entregable_clave?: string | null;
}
interface DiaConSesiones {
    dia_id: number;
    dia_numero: number;
    nombre_dia: string;
    fecha: string;
    sesiones: SesionEvento[];
}

// Función para obtener los datos (Server Component)
async function getScheduleData(): Promise<DiaConSesiones[]> {
    try {
        const res = await fetch("http://localhost:3001/api/cronograma", {
            cache: 'no-store' // Para asegurar datos frescos, o ajusta el cache
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch schedule:", error);
        return []; // Devuelve array vacío en caso de error
    }
}

// Helper para formatear fecha (opcional)
function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString + 'T00:00:00'); // Asegura zona horaria local
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
        return dateString; // Fallback
    }
}

export default async function AgendaPage() {
    const schedule = await getScheduleData();

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold text-center mb-4">Agenda del Evento</h1>
            <p className="text-xl text-neutral-600 text-center mb-12">Rueda de Problemas 2025</p>

            {schedule.length === 0 ? (
                <p className="text-center text-neutral-500">El cronograma aún no está disponible. Vuelve pronto.</p>
            ) : (
                <div className="space-y-10">
                    {schedule.map((dia) => (
                        <div key={dia.dia_id}>
                            <h2 className="text-2xl font-semibold mb-2 border-b pb-2">{dia.nombre_dia}</h2>
                            <p className="text-lg text-neutral-700 font-medium mb-6">{formatDate(dia.fecha)}</p>

                            {dia.sesiones.length === 0 ? (
                                <p className="text-neutral-500 italic">No hay sesiones programadas para este día.</p>
                            ) : (
                                <div className="space-y-6">
                                    {dia.sesiones.map((sesion) => (
                                        <Card key={sesion.sesion_id} className="shadow-md">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-xl">{sesion.bloque_tematico}</CardTitle>
                                                        <CardDescription className="text-base text-neutral-800 font-semibold pt-1">
                                                            {sesion.horario_display}
                                                        </CardDescription>
                                                    </div>
                                                    {/* Podrías añadir un icono o badge aquí */}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-3">
                                                {sesion.foco_objetivos && (
                                                    <div>
                                                        <p className="font-medium text-neutral-800">Foco / Objetivos:</p>
                                                        <p className="text-neutral-600">{sesion.foco_objetivos}</p>
                                                    </div>
                                                )}
                                                {sesion.entregable_clave && (
                                                    <div>
                                                        <p className="font-medium text-neutral-800">Entregable Clave:</p>
                                                        <p className="text-neutral-600">{sesion.entregable_clave}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}