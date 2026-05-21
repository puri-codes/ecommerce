import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, ensureOrdersTable, getAdminBySessionToken } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['pending', 'contacted', 'completed'] as const;

export async function PATCH(req: Request, { params }: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await getAdminBySessionToken(token);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureOrdersTable();
  const { id } = await params;
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const res = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(res.rows[0]);
}
