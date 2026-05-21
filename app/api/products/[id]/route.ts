import { NextResponse } from 'next/server';
import { pool, ensureTables } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const JSONB_FIELDS = new Set(['variants', 'image_groups']);
const ALLOWED_FIELDS = new Set([
  'name', 'slug', 'description', 'category', 'gender',
  'base_price', 'compare_price', 'is_active', 'is_featured',
  'variants', 'image_groups',
  'meta_title', 'meta_description', 'meta_keywords',
]);

export async function PUT(req: Request, { params }: RouteContext) {
  await ensureTables();
  const { id } = await params;
  const data = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of Object.keys(data)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    fields.push(`${key} = $${idx}`);
    values.push(JSONB_FIELDS.has(key) ? JSON.stringify(data[key]) : data[key]);
    idx++;
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'no valid fields' }, { status: 400 });
  }

  values.push(id);
  const res = await pool.query(
    `UPDATE products SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
    values
  );

  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const payload = JSON.stringify({ action: 'update', product: res.rows[0] });
  await pool.query(`NOTIFY products, '${payload.replace(/'/g, "''")}'`);

  return NextResponse.json(res.rows[0]);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  await ensureTables();
  const { id } = await params;
  const res = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
  const payload = JSON.stringify({ action: 'delete', id });
  await pool.query(`NOTIFY products, '${payload.replace(/'/g, "''")}'`);
  return NextResponse.json({ deleted: res.rows[0] ?? null });
}
