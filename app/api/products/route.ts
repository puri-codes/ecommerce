import { NextResponse } from 'next/server';
import { pool, ensureTables } from '@/lib/db';

export async function GET() {
  await ensureTables();
  const res = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  return NextResponse.json(res.rows);
}

export async function POST(req: Request) {
  await ensureTables();
  const data = await req.json();

  const {
    name,
    slug,
    description,
    category,
    gender,
    base_price,
    compare_price,
    is_active,
    variants,
    image_groups,
    meta_title,
    meta_description,
    meta_keywords,
  } = data;

  const res = await pool.query(
    `INSERT INTO products
      (name, slug, description, category, gender, base_price, compare_price,
       is_active, variants, image_groups, meta_title, meta_description, meta_keywords,
       created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now())
     RETURNING *`,
    [
      name,
      slug,
      description ?? null,
      category ?? null,
      gender ?? 'unisex',
      base_price ?? 0,
      compare_price ?? null,
      is_active ?? true,
      JSON.stringify(variants ?? []),
      JSON.stringify(image_groups ?? []),
      meta_title ?? null,
      meta_description ?? null,
      meta_keywords ?? null,
    ]
  );

  const payload = JSON.stringify({ action: 'create', product: res.rows[0] });
  await pool.query(`NOTIFY products, '${payload.replace(/'/g, "''")}'`);

  return NextResponse.json(res.rows[0]);
}
