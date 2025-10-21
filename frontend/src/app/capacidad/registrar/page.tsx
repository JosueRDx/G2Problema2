"use client";
 import { useAuth } from "@/context/AuthContext";
 import { useRouter } from "next/navigation";
 import { useEffect } from "react";
 import FormularioCapacidadUnsa from "./components/FormularioCapacidadUnsa";

 export default function RegistrarCapacidadPage() {
   const { user, isLoading } = useAuth();
   const router = useRouter();

   useEffect(() => {
     if (!isLoading && !user) {
       router.push("/login?error=unauthorized");
     } else if (!isLoading && user && user.rol !== 'unsa') {
       // Si no es UNSA, redirigir o mostrar mensaje
       console.warn("Acceso denegado: Usuario no es de UNSA");
       router.push("/"); // O a una página específica de error/acceso denegado
     }
   }, [user, isLoading, router]);

   // Muestra carga o nada mientras se verifica
   if (isLoading || !user || user.rol !== 'unsa') {
     return (
        <div className="flex justify-center items-center min-h-[calc(100vh-theme(space.16))]">
            <p>Cargando...</p> {/* O un spinner */}
        </div>
     );
   }

   // Renderiza el formulario si es usuario UNSA
   return (
      <FormularioCapacidadUnsa />
   );
 }