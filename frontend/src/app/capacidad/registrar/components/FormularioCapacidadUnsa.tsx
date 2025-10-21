// /frontend/src/app/capacidad/registrar/components/FormularioCapacidadUnsa.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Asegúrate que esta es la ÚNICA línea que importa o define Textarea en este archivo
import { Textarea } from "@/components/ui/textarea"; 
import Cookies from "js-cookie";

// Esquema Zod para la validación
const capacidadSchema = z.object({
  descripcion_capacidad: z.string().min(10, { message: "Descripción requerida (mínimo 10 caracteres)." }),
  problemas_que_resuelven: z.string().optional(),
  tipos_proyectos: z.string().optional(),
  equipamiento: z.string().optional(),
  palabrasClave: z.string().optional(), // Podrías validar formato si quieres
  clave_interna: z.string().optional(),
});

type CapacidadFormData = z.infer<typeof capacidadSchema>;
type FieldErrors = { [key in keyof CapacidadFormData]?: string };

export default function FormularioCapacidadUnsa() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CapacidadFormData>({
    descripcion_capacidad: "",
    problemas_que_resuelven: "",
    tipos_proyectos: "",
    equipamiento: "",
    palabrasClave: "",
    clave_interna: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const result = capacidadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as keyof CapacidadFormData;
        if (path) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Por favor corrija los errores en el formulario.");
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const token = Cookies.get('token');

    if (!token) {
        toast.error("Error de autenticación", { description: "No se encontró token. Inicia sesión de nuevo." });
        setIsLoading(false);
        router.push('/login');
        return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/capacidades", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Incluye el token
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al registrar la capacidad.");
      }

      toast.success("¡Capacidad Registrada!", { description: "Tu capacidad ha sido guardada correctamente." });
      // Podrías redirigir a una página de "mis capacidades" o al dashboard
      router.push("/"); // Por ahora al inicio

    } catch (error: any) {
      setIsLoading(false);
      toast.error("Error en el registro", { description: error.message });
    }
  };

  return (
     <Card className="w-full max-w-2xl mx-auto my-12">
        <CardHeader>
           <CardTitle className="text-2xl font-bold">Registrar Capacidad UNSA</CardTitle>
           <CardDescription>Describe tus capacidades de investigación e innovación.</CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleSubmit} className="space-y-6">
                {/* Descripción de la Capacidad */}
                <div className="space-y-2">
                    <Label htmlFor="descripcion_capacidad">Descripción de la Capacidad *</Label>
                    <Textarea
                        id="descripcion_capacidad"
                        name="descripcion_capacidad"
                        placeholder="Detalla la capacidad, expertise, línea de investigación..."
                        value={formData.descripcion_capacidad}
                        onChange={handleChange}
                        rows={4}
                    />
                    {errors.descripcion_capacidad && <p className="text-sm text-red-600">{errors.descripcion_capacidad}</p>}
                </div>

                 {/* Problemas que pueden resolver */}
                <div className="space-y-2">
                    <Label htmlFor="problemas_que_resuelven">Problemas que pueden resolver</Label>
                    <Textarea
                        id="problemas_que_resuelven"
                        name="problemas_que_resuelven"
                        placeholder="Ej: Optimización de procesos industriales, análisis de datos complejos..."
                        value={formData.problemas_que_resuelven}
                        onChange={handleChange}
                        rows={3}
                    />
                     {errors.problemas_que_resuelven && <p className="text-sm text-red-600">{errors.problemas_que_resuelven}</p>}
                </div>

                 {/* Tipos de Proyectos */}
                 <div className="space-y-2">
                    <Label htmlFor="tipos_proyectos">Tipos de Proyectos</Label>
                    <Textarea
                        id="tipos_proyectos"
                        name="tipos_proyectos"
                        placeholder="Ej: Desarrollo de prototipos, estudios de factibilidad, consultoría técnica..."
                        value={formData.tipos_proyectos}
                        onChange={handleChange}
                        rows={3}
                    />
                     {errors.tipos_proyectos && <p className="text-sm text-red-600">{errors.tipos_proyectos}</p>}
                </div>

                 {/* Equipamiento */}
                 <div className="space-y-2">
                    <Label htmlFor="equipamiento">Equipamiento Disponible</Label>
                    <Textarea
                        id="equipamiento"
                        name="equipamiento"
                        placeholder="Laboratorios, software especializado, maquinaria..."
                        value={formData.equipamiento}
                        onChange={handleChange}
                        rows={3}
                    />
                    {errors.equipamiento && <p className="text-sm text-red-600">{errors.equipamiento}</p>}
                 </div>

                 {/* Palabras Clave */}
                 <div className="space-y-2">
                    <Label htmlFor="palabrasClave">Palabras Clave</Label>
                    <Input
                        id="palabrasClave"
                        name="palabrasClave"
                        placeholder="Separadas por comas (ej: inteligencia artificial, biotecnología)"
                        value={formData.palabrasClave}
                        onChange={handleChange}
                    />
                     <p className="text-xs text-neutral-500">Ayudan a encontrar tu capacidad.</p>
                     {errors.palabrasClave && <p className="text-sm text-red-600">{errors.palabrasClave}</p>}
                 </div>

                 {/* Clave Interna (Opcional) */}
                 <div className="space-y-2">
                    <Label htmlFor="clave_interna">Clave Interna (Opcional)</Label>
                    <Input
                        id="clave_interna"
                        name="clave_interna"
                        placeholder="Código de grupo, proyecto, etc."
                        value={formData.clave_interna}
                        onChange={handleChange}
                    />
                     {errors.clave_interna && <p className="text-sm text-red-600">{errors.clave_interna}</p>}
                 </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registrando..." : "Registrar Capacidad"}
                </Button>
           </form>
        </CardContent>
     </Card>
  );
}

// BORRA TODO DESDE AQUÍ HACIA ABAJO EN TU ARCHIVO
// Necesitarás crear este componente básico (o usar uno de shadcn si lo instalas)
// /frontend/src/components/ui/textarea.tsx
/* BORRA ESTO -> 
import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
*/ // <- HASTA AQUÍ