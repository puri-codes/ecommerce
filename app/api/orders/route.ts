import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, ensureOrdersTable, getAdminBySessionToken } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await getAdminBySessionToken(token);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureOrdersTable();
  const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  return NextResponse.json(res.rows);
}

export async function POST(req: Request) {
  await ensureOrdersTable();
  const { customer_name, phone, address, items, subtotal, promo_code, discount_amount } = await req.json();

  if (!customer_name || !/^\d{10}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
  }

  const res = await pool.query(
    `INSERT INTO orders (customer_name, phone, address, items, subtotal, promo_code, discount_amount, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', now())
     RETURNING *`,
    [customer_name, phone, address ?? null, JSON.stringify(items ?? []), subtotal ?? 0,
     promo_code ?? null, discount_amount ?? 0]
  );

  return NextResponse.json(res.rows[0], { status: 201 });
}
