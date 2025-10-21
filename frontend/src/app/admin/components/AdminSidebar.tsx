"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, Lightbulb, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/desafios", label: "Desafíos", icon: FileText },
  { href: "/admin/capacidades", label: "Capacidades UNSA", icon: Lightbulb },
  { href: "/admin/cronograma", label: "Cronograma", icon: Calendar },
];

function getLinkClassName(pathname: string, href: string) {
  return `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    pathname === href
      ? "bg-neutral-900 text-white"
      : "text-neutral-600 hover:bg-neutral-100"
  }`;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-white border-r z-40 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b">
        <h2 className="text-xl font-bold text-neutral-900">
          Admin
          <span className="font-light text-neutral-600"> UNSA</span>
        </h2>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={getLinkClassName(pathname, link.href)}
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}