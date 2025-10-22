// /backend/src/api/users/users.controller.ts
import { Request, Response } from 'express';
import { listUsers, Rol } from './users.service';

function parseRole(roleParam?: string): Rol | undefined {
  if (roleParam === 'admin' || roleParam === 'externo' || roleParam === 'unsa') return roleParam;
  return undefined;
}

export async function getUsers(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const role = parseRole(typeof req.query.role === 'string' ? req.query.role : undefined);
    const page = Number(req.query.page ?? 1) || 1;
    const pageSize = Number(req.query.pageSize ?? 10) || 10;

    const { data, total } = await listUsers(q, role, page, pageSize);
    res.json({ data, total, page, pageSize });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo obtener la lista de usuarios.' });
  }
}

export async function exportUsersCSV(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const role = parseRole(typeof req.query.role === 'string' ? req.query.role : undefined);

    // Para exportar todo, ignoramos paginación aquí
    const { data } = await listUsers(q, role, 1, 100000); // límite grande

    // Armar CSV
    const headers = ['usuario_id','email','rol','nombres_apellidos','telefono','unidad_academica'];
    const lines = [
      headers.join(','),
      ...data.map(u => [
        u.usuario_id,
        `"${(u.email ?? '').replace(/"/g, '""')}"`,
        u.rol,
        `"${(u.nombres_apellidos ?? '').replace(/"/g, '""')}"`,
        `"${(u.telefono ?? '').replace(/"/g, '""')}"`,
        `"${(u.unidad_academica ?? '').replace(/"/g, '""')}"`,
      ].join(','))
    ];

    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="usuarios.csv"');
    res.status(200).send(csv);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'No se pudo exportar CSV.' });
  }
}
