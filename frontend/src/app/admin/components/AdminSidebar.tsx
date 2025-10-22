"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// Importa el nuevo icono (Network) junto con los existentes
import { LayoutDashboard, Users, FileText, Lightbulb, Calendar, LogOut, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";

// Añade el nuevo enlace al array 'links'
const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/desafios", label: "Desafíos", icon: FileText },
  { href: "/admin/capacidades", label: "Capacidades UNSA", icon: Lightbulb },
  { href: "/admin/cronograma", label: "Cronograma", icon: Calendar },
  { href: "/admin/matching", label: "Matching", icon: Network }, // <-- NUEVA LÍNEA AÑADIDA
];

// Función para determinar el estilo del enlace (activo o inactivo)
function getLinkClassName(pathname: string, href: string) {
  return `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    pathname === href
      ? "bg-neutral-900 text-white" // Estilo activo
      : "text-neutral-600 hover:bg-neutral-100" // Estilo inactivo
  }`;
}

// Componente de la barra lateral
export function AdminSidebar() {
  const pathname = usePathname(); // Hook para obtener la ruta actual
  const router = useRouter(); // Hook para manejar la navegación

  // Función para cerrar sesión
  const handleLogout = () => {
    Cookies.remove('token'); // Elimina la cookie del token
    localStorage.removeItem('user'); // Elimina datos del usuario del localStorage (si los usas)
    router.push('/login'); // Redirige a la página de login
  };

  // Renderizado del componente
  return (
    // Contenedor principal de la barra lateral
    <aside className="fixed top-0 left-0 w-64 h-full bg-white border-r z-40 flex flex-col">
      {/* Sección del título/logo */}
      <div className="h-16 flex items-center px-6 border-b">
         {/* Enlace al dashboard principal del admin */}
         <Link href="/admin/dashboard" className="text-xl font-bold text-neutral-900 hover:text-neutral-700 transition-colors">
            Admin
           <span className="font-light text-neutral-500"> RDP</span> {/* Puedes ajustar el nombre aquí */}
         </Link>
      </div>
      {/* Sección de navegación */}
      {/* flex-grow hace que ocupe el espacio vertical disponible */}
      <nav className="flex-grow p-4 space-y-1"> {/* Reducido space-y para más densidad */}
        {/* Mapea cada enlace del array 'links' a un componente Link */}
        {links.map((link) => (
          <Link
            key={link.href} // Clave única para React
            href={link.href} // Destino del enlace
            className={getLinkClassName(pathname, link.href)} // Aplica estilo condicional (activo/inactivo)
          >
            {/* Renderiza el icono correspondiente */}
            <link.icon className="w-4 h-4 mr-2" /> {/* Icono más pequeño */}
            {/* Muestra la etiqueta del enlace */}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      {/* Sección inferior con el botón de cerrar sesión */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start text-sm" onClick={handleLogout}> {/* justify-start para alinear texto e icono a la izquierda */}
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}