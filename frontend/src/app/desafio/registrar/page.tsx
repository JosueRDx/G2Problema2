"use client";
 import { useAuth } from "@/context/AuthContext";
 import { useRouter } from "next/navigation";
 import { useEffect } from "react";
 import FormularioDesafioExterno from "./components/FormularioDesafioExterno";

 export default function RegistrarDesafioPage() {
   const { user, isLoading } = useAuth();
   const router = useRouter();

   useEffect(() => {
     if (!isLoading && !user) {
       router.push("/login?error=unauthorized");
     } else if (!isLoading && user && user.rol !== 'externo') {
        console.warn("Acceso denegado: Usuario no es externo");
       router.push("/"); // Redirigir si no es rol 'externo'
     }
   }, [user, isLoading, router]);

   if (isLoading || !user || user.rol !== 'externo') {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-theme(space.16))]">
            <p>Cargando...</p> {/* O un spinner */}
        </div>
     );
   }

   return (
     <FormularioDesafioExterno />
   );
 }