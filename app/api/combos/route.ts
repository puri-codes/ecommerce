import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, ensureCombosTable, getAdminBySessionToken } from '@/lib/db';

export async function GET() {
  await ensureCombosTable();
  const res = await pool.query('SELECT * FROM combos ORDER BY created_at DESC');
  return NextResponse.json(res.rows);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token || !(await getAdminBySessionToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureCombosTable();
  const { name, slug, description, is_active, items, original_price, combo_price, image_url, meta_title, meta_description } = await req.json();

  const res = await pool.query(
    `INSERT INTO combos (name,slug,description,is_active,items,original_price,combo_price,image_url,meta_title,meta_description,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now()) RETURNING *`,
    [name, slug, description ?? null, is_active ?? true, JSON.stringify(items ?? []),
     original_price ?? 0, combo_price ?? 0, image_url ?? null, meta_title ?? null, meta_description ?? null]
  );
  return NextResponse.json(res.rows[0], { status: 201 });
}
