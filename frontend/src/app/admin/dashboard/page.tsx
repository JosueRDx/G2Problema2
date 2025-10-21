export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900">
        Bienvenido al Dashboard
      </h1>
      <p className="text-neutral-600 mt-2">
        Seleccione una opción del menú lateral para comenzar a gestionar la
        plataforma.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold">Total Usuarios</h3>
          <p className="text-4xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold">Desafíos Registrados</h3>
          <p className="text-4xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold">Capacidades UNSA</h3>
          <p className="text-4xl font-bold mt-2">0</p>
        </div>
      </div>
    </div>
  );
}