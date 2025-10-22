// /frontend/src/app/admin/usuarios/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Link from "next/link";

type Rol = "admin" | "externo" | "unsa";
type RolFiltro = "todos" | Rol;

type UserRow = {
  usuario_id: number;
  email: string;
  rol: Rol;
  nombres_apellidos: string | null;
  telefono: string | null;
  unidad_academica: string | null;
};

type UsersResponse = {
  data: UserRow[];
  total: number;
  page: number;
  pageSize: number;
};

export default function UsuariosPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtros y paginación (controlados)
  const [q, setQ] = useState("");
  const [rol, setRol] = useState<RolFiltro>("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce de 'q'
  const [qDebounced, setQDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Snapshot para “Deshacer”
  const [prevState, setPrevState] = useState<{
    rows: UserRow[];
    total: number;
    q: string;
    rol: RolFiltro;
    page: number;
    pageSize: number;
  } | null>(null);

  // Helper para tomar snapshot SOLO la primera vez que el usuario cambia algo
  const snapshotOnce = () => {
    if (prevState === null) {
      setPrevState({ rows, total, q, rol, page, pageSize });
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // Fetch automático cuando cambian filtros (qDebounced, rol) o paginación
  useEffect(() => {
    let aborted = false;

    async function fetchUsers() {
      try {
        setLoading(true);
        const token = Cookies.get("token");
        if (!token) {
          toast.error("Sesión expirada. Inicia sesión nuevamente.");
          return;
        }
        const url = new URL("http://localhost:3001/api/users");
        if (qDebounced) url.searchParams.set("q", qDebounced);
        if (rol !== "todos") url.searchParams.set("role", rol);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(pageSize));

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const json: UsersResponse = await res.json();
        if (aborted) return;
        setRows(json.data);
        setTotal(json.total);
      } catch (e) {
        if (!aborted) {
          console.error(e);
          toast.error("No se pudo cargar la lista de usuarios.");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchUsers();
    return () => {
      aborted = true;
    };
  }, [qDebounced, rol, page, pageSize]);

  // Handlers
  const onChangeQuery = (val: string) => {
    snapshotOnce();       // guarda el estado anterior la primera vez
    setQ(val);
    setPage(1);           // al cambiar el texto, volvemos a la página 1
  };

  const onChangeRol = (value: RolFiltro) => {
    snapshotOnce();
    setRol(value);
    setPage(1);           // al cambiar rol, volvemos a la página 1
  };

  const onChangePageSize = (n: number) => {
    snapshotOnce();
    setPageSize(n);
    setPage(1);
  };

  const goPrev = () => {
    snapshotOnce();
    setPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    snapshotOnce();
    setPage((p) => Math.min(totalPages, p + 1));
  };

  const onUndo = () => {
    if (!prevState) return;
    setRows(prevState.rows);
    setTotal(prevState.total);
    setQ(prevState.q);
    setRol(prevState.rol);
    setPage(prevState.page);
    setPageSize(prevState.pageSize);
    setPrevState(null);
  };

  const onClear = () => {
    setPrevState(null);
    setQ("");
    setRol("todos");
    setPage(1);
    setPageSize(10);
  };

  const exportCSV = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        return;
      }
      const url = new URL("http://localhost:3001/api/users/export");
      if (qDebounced) url.searchParams.set("q", qDebounced);
      if (rol !== "todos") url.searchParams.set("role", rol);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = "usuarios.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo exportar el CSV.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Usuarios</h1>

        <div className="flex items-center gap-2">
          {/* Filtro por Rol (server-side) */}
          <select
            value={rol}
            onChange={(e) => onChangeRol(e.target.value as RolFiltro)}
            className="border rounded-xl px-3 py-2 outline-none focus:ring"
            aria-label="Filtrar por rol"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="externo">Externo</option>
            <option value="unsa">UNSA</option>
          </select>

          {/* Buscador con live search */}
          <input
            value={q}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="border rounded-xl px-3 py-2 outline-none focus:ring w-64"
          />

          {/* Deshacer / Limpiar / Exportar */}
          {prevState && (
            <button
              onClick={onUndo}
              className="px-4 py-2 rounded-xl border hover:shadow"
              title="Volver a la lista anterior"
            >
              Deshacer
            </button>
          )}
          <button
            onClick={onClear}
            className="px-4 py-2 rounded-xl border hover:shadow"
            title="Limpiar filtros y recargar"
          >
            Limpiar
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl border hover:shadow"
            title="Exportar CSV"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev}
          className="px-3 py-2 rounded-xl border hover:shadow disabled:opacity-50"
          disabled={page <= 1}
        >
          ← Anterior
        </button>
        <div className="text-sm">
          Página <span className="font-medium">{page}</span> de{" "}
          <span className="font-medium">
            {Math.max(1, Math.ceil(total / pageSize))}
          </span>{" "}
          — <span className="font-medium">{total}</span> resultados
        </div>
        <button
          onClick={goNext}
          className="px-3 py-2 rounded-xl border hover:shadow disabled:opacity-50"
          disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
        >
          Siguiente →
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onChangePageSize(Number(e.target.value))}
            className="border rounded-xl px-3 py-2 outline-none focus:ring"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Unidad Académica</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  Sin resultados
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.usuario_id} className="border-t">
                  <td className="px-4 py-3">{u.usuario_id}</td>
                  <td className="px-4 py-3">{u.nombres_apellidos ?? "—"}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.rol}</td>
                  <td className="px-4 py-3">{u.telefono ?? "—"}</td>
                  <td className="px-4 py-3">{u.unidad_academica ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2">
        <Link href="/admin/dashboard" className="text-sm underline hover:opacity-80">
          ← Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
