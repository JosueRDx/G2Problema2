"use client"; 

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; 
import { ArrowLeftRight, MessageSquare, ListChecks } from "lucide-react"; 

// Define los enlaces para las subsecciones de Matchs
const subNavLinks = [
  { href: "/matchs/realizar", label: "Realizar Match", icon: ArrowLeftRight },
  { href: "/matchs/chats", label: "Chats", icon: MessageSquare },
  { href: "/matchs/mis-registros", label: "Mis Registros", icon: ListChecks },
];

export default function MatchsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); 
  const router = useRouter();
  const { user, isLoading } = useAuth(); 

  // Efecto para proteger la sección completa de /matchs
  useEffect(() => {
    if (!isLoading && !user) {
      // Si no está cargando y no hay usuario, redirige a login
      router.push("/login?error=unauthorized&next=/matchs"); 
    } else if (!isLoading && user && user.rol !== 'externo' && user.rol !== 'unsa') {
      // Si está logueado pero NO es externo ni unsa, redirige a la página principal
       console.warn("Acceso denegado a /matchs: Rol no permitido:", user.rol);
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Muestra un estado de carga o nulo mientras se verifica el usuario
  // Esto evita mostrar brevemente el layout a usuarios no autorizados
  if (isLoading || !user || (user.rol !== 'externo' && user.rol !== 'unsa')) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(space.16))]">
        <p>Verificando acceso...</p> {/* O un spinner */}
      </div>
    );
  }

  // Si el usuario está verificado y tiene el rol correcto, muestra el layout
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Columna de Navegación Lateral */}
        <aside className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Sección Matchs</h2>
          <nav className="space-y-2">
            {subNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname.startsWith(link.href) 
                    ? "bg-neutral-100 text-neutral-900 font-medium"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Columna de Contenido Principal */}
        <main className="md:col-span-3">
          {/* Aquí se renderizará el contenido de cada página (page.tsx) */}
          {children}
        </main>
      </div>
    </div>
  );
}