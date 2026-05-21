import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, ensureCombosTable, getAdminBySessionToken } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = new Set(['name','slug','description','is_active','items','original_price','combo_price','image_url','meta_title','meta_description']);
const JSON_FIELDS = new Set(['items']);

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  return getAdminBySessionToken(token);
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureCombosTable();
  const { id } = await params;
  const data = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const key of Object.keys(data)) {
    if (!ALLOWED.has(key)) continue;
    fields.push(`${key}=$${idx++}`);
    values.push(JSON_FIELDS.has(key) ? JSON.stringify(data[key]) : data[key]);
  }
  if (!fields.length) return NextResponse.json({ error: 'no fields' }, { status: 400 });
  values.push(id);
  const res = await pool.query(
    `UPDATE combos SET ${fields.join(',')},updated_at=now() WHERE id=$${idx} RETURNING *`, values
  );
  return NextResponse.json(res.rows[0]);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureCombosTable();
  const { id } = await params;
  await pool.query('DELETE FROM combos WHERE id=$1', [id]);
  return NextResponse.json({ ok: true });
}
