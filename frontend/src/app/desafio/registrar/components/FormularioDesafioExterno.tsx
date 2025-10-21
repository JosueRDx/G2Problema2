// /frontend/src/app/desafio/registrar/components/FormularioDesafioExterno.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Cookies from "js-cookie";

// Esquema Zod (ajusta según necesidad, ej: tamaño máximo archivo)
const desafioSchema = z.object({
  titulo: z.string().min(5, { message: "Título requerido (mínimo 5 caracteres)." }),
  descripcion: z.string().min(10, { message: "Descripción requerida (mínimo 10 caracteres)." }),
  impacto: z.string().optional(),
  intentos_previos: z.string().optional(),
  solucion_imaginada: z.string().optional(),
  palabrasClave: z.string().optional(),
  // Validación de archivo es más compleja, Zod no la maneja directamente en el cliente fácil
});

type DesafioFormData = Omit<z.infer<typeof desafioSchema>, 'adjunto'>; // Omitimos adjunto del tipo principal
type FieldErrors = { [key in keyof DesafioFormData]?: string };

export default function FormularioDesafioExterno() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DesafioFormData>({
    titulo: "",
    descripcion: "",
    impacto: "",
    intentos_previos: "",
    solucion_imaginada: "",
    palabrasClave: "",
  });
  const [adjunto, setAdjunto] = useState<File | null>(null); // Estado para el archivo
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
     if (errors[name as keyof FieldErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAdjunto(e.target.files[0]);
      // Aquí podrías añadir validación de tamaño/tipo en el cliente
    } else {
      setAdjunto(null);
    }
  };

   const validateForm = (): boolean => {
    const result = desafioSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as keyof DesafioFormData;
        if (path) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Por favor corrija los errores en el formulario.");
      return false;
    }
    // Podrías añadir validación de archivo aquí si es necesario
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

    // Usar FormData para enviar archivos
    const dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) { // Solo añadir si hay valor
          dataToSend.append(key, value);
      }
    });
    if (adjunto) {
      dataToSend.append('adjunto', adjunto); // El backend (multer) buscará este nombre
    }

    try {
      // Nota: No se usa 'Content-Type': 'application/json' con FormData
      const res = await fetch("http://localhost:3001/api/desafios", {
        method: "POST",
        headers: {
            // 'Content-Type' es establecido automáticamente por el navegador para FormData
             "Authorization": `Bearer ${token}`
        },
        body: dataToSend,
      });

      const resultData = await res.json(); // Leer la respuesta JSON

      if (!res.ok) {
        throw new Error(resultData.message || "Error al registrar el desafío.");
      }

      toast.success("¡Desafío Registrado!", { description: "Tu desafío ha sido guardado correctamente." });
      router.push("/"); // O a "mis desafíos"

    } catch (error: any) {
      setIsLoading(false);
      console.error("Error submitting desafio:", error);
      toast.error("Error en el registro", { description: error.message });
    }
  };

  return (
     <Card className="w-full max-w-2xl mx-auto my-12">
       <CardHeader>
           <CardTitle className="text-2xl font-bold">Registrar Desafío Externo</CardTitle>
           <CardDescription>Describe el problema o necesidad que buscas resolver.</CardDescription>
       </CardHeader>
       <CardContent>
           <form onSubmit={handleSubmit} className="space-y-6">
               {/* Título */}
               <div className="space-y-2">
                   <Label htmlFor="titulo">Título del Desafío *</Label>
                   <Input id="titulo" name="titulo" placeholder="Ej: Reducir consumo de agua en proceso X" value={formData.titulo} onChange={handleChange} />
                   {errors.titulo && <p className="text-sm text-red-600">{errors.titulo}</p>}
               </div>

                {/* Descripción */}
               <div className="space-y-2">
                   <Label htmlFor="descripcion">Descripción Detallada *</Label>
                   <Textarea id="descripcion" name="descripcion" placeholder="Contexto, problema específico, qué se necesita..." value={formData.descripcion} onChange={handleChange} rows={5} />
                   {errors.descripcion && <p className="text-sm text-red-600">{errors.descripcion}</p>}
               </div>

                {/* Impacto */}
               <div className="space-y-2">
                   <Label htmlFor="impacto">Impacto Esperado</Label>
                   <Textarea id="impacto" name="impacto" placeholder="Beneficios si se resuelve (económico, social, ambiental...)" value={formData.impacto} onChange={handleChange} rows={3}/>
                    {errors.impacto && <p className="text-sm text-red-600">{errors.impacto}</p>}
               </div>

                {/* Intentos Previos */}
               <div className="space-y-2">
                   <Label htmlFor="intentos_previos">Intentos Previos (si los hubo)</Label>
                   <Textarea id="intentos_previos" name="intentos_previos" placeholder="¿Qué se ha intentado antes para solucionar esto?" value={formData.intentos_previos} onChange={handleChange} rows={3} />
                    {errors.intentos_previos && <p className="text-sm text-red-600">{errors.intentos_previos}</p>}
               </div>

                {/* Solución Imaginada */}
               <div className="space-y-2">
                   <Label htmlFor="solucion_imaginada">Solución Imaginada (opcional)</Label>
                   <Textarea id="solucion_imaginada" name="solucion_imaginada" placeholder="¿Tienes alguna idea de cómo podría ser la solución?" value={formData.solucion_imaginada} onChange={handleChange} rows={3} />
                    {errors.solucion_imaginada && <p className="text-sm text-red-600">{errors.solucion_imaginada}</p>}
               </div>

                {/* Palabras Clave */}
               <div className="space-y-2">
                   <Label htmlFor="palabrasClave">Palabras Clave</Label>
                   <Input id="palabrasClave" name="palabrasClave" placeholder="Separadas por comas (ej: agricultura, sensores, optimización)" value={formData.palabrasClave} onChange={handleChange} />
                   <p className="text-xs text-neutral-500">Ayudan a conectar tu desafío con capacidades.</p>
                   {errors.palabrasClave && <p className="text-sm text-red-600">{errors.palabrasClave}</p>}
               </div>

                {/* Adjunto */}
                <div className="space-y-2">
                    <Label htmlFor="adjunto">Adjuntar Archivo (Opcional)</Label>
                    <Input id="adjunto" name="adjunto" type="file" onChange={handleFileChange} />
                    <p className="text-xs text-neutral-500">Puedes subir imágenes, PDFs, documentos (máx 5MB).</p>
                    {/* Mensaje de error específico para adjunto si implementas validación */}
                </div>


               <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading ? "Registrando..." : "Registrar Desafío"}
               </Button>
           </form>
       </CardContent>
     </Card>
  );
}