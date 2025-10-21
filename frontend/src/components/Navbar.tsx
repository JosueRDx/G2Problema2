// /frontend/src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon, FilePlus } from "lucide-react";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white/80 border-b z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-neutral-900">
              Rueda de Problemas
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/agenda" 
              className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
            >
              Agenda
            </Link>

            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-md"></div>
            ) : user ? (
              <>
               {user.rol === 'externo' && ( 
                 <Link 
                   href="/desafio/registrar" 
                   className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
                 >
                   <FilePlus className="w-4 h-4 mr-1" />
                   Registrar Desafío
                 </Link>
               )}
               {user.rol === 'unsa' && ( 
                 <Link 
                   href="/capacidad/registrar" 
                   className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
                 >
                   <FilePlus className="w-4 h-4 mr-1" />
                   Registrar Capacidad
                 </Link>
               )}

                {/* --- CAMBIO AQUÍ: Mostrar nombre en lugar de email --- */}
                <span className="text-sm text-neutral-700 flex items-center">
                   <UserIcon className="w-4 h-4 mr-1 text-neutral-500"/> 
                   {user.nombres_apellidos} {/* <-- CAMBIADO */}
                   {user.rol === 'admin' && <span className="ml-1 text-xs text-red-600 font-semibold">(Admin)</span>}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-600 hover:text-red-600">
                   <LogOut className="w-4 h-4 mr-1" /> Salir
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                 <Button asChild size="sm">
                   <Link href="/registro">Registrarse</Link>
                 </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}