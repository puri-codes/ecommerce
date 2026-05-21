import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, ensurePromoCodesTable, getAdminBySessionToken } from '@/lib/db';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  return getAdminBySessionToken(token);
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensurePromoCodesTable();
  const res = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
  return NextResponse.json(res.rows);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensurePromoCodesTable();

  const { code, discount_percent, max_discount, min_order_amount, is_active, expires_at } = await req.json();
  if (!code || !discount_percent) {
    return NextResponse.json({ error: 'code and discount_percent required' }, { status: 400 });
  }

  const res = await pool.query(
    `INSERT INTO promo_codes (code,discount_percent,max_discount,min_order_amount,is_active,expires_at,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING *`,
    [code.toUpperCase().trim(), discount_percent, max_discount ?? null,
     min_order_amount ?? 0, is_active ?? true, expires_at ?? null]
  );
  return NextResponse.json(res.rows[0], { status: 201 });
}
