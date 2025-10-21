import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t text-neutral-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-semibold text-neutral-900">UNSA - Vicerrectorado de Investigación</h3>
            <p className="mt-2">Universidad Nacional de San Agustín de Arequipa</p>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Rueda de Problemas 2025</h3>
            <p className="mt-2">Conectando Desafíos con Soluciones</p>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Aliados Estratégicos</h3>
            <ul className="mt-2 space-y-1">
              <li>OCEAN SRL</li>
              <li>SOPECIN</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm">
          <p>© 2025 UNSA. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}