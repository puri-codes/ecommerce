import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, ensurePromoCodesTable, getAdminBySessionToken } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  return getAdminBySessionToken(token);
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensurePromoCodesTable();
  const { id } = await params;
  const { code, discount_percent, max_discount, min_order_amount, is_active, expires_at } = await req.json();

  const res = await pool.query(
    `UPDATE promo_codes SET
       code=$1, discount_percent=$2, max_discount=$3,
       min_order_amount=$4, is_active=$5, expires_at=$6
     WHERE id=$7 RETURNING *`,
    [code?.toUpperCase().trim(), discount_percent, max_discount ?? null,
     min_order_amount ?? 0, is_active ?? true, expires_at ?? null, id]
  );
  return NextResponse.json(res.rows[0]);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensurePromoCodesTable();
  const { id } = await params;
  await pool.query('DELETE FROM promo_codes WHERE id=$1', [id]);
  return NextResponse.json({ ok: true });
}
