import { NextResponse } from 'next/server';
import { pool, ensurePromoCodesTable } from '@/lib/db';

export async function POST(req: Request) {
  await ensurePromoCodesTable();
  const { code, order_amount } = await req.json();

  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' });

  const res = await pool.query(
    `SELECT * FROM promo_codes
     WHERE code=$1 AND is_active=true
       AND (expires_at IS NULL OR expires_at > now())
     LIMIT 1`,
    [code.toUpperCase().trim()]
  );

  if (res.rowCount === 0) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired promo code' });
  }

  const promo = res.rows[0];
  const amount = Number(order_amount) || 0;

  if (amount < Number(promo.min_order_amount)) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order of Rs. ${Number(promo.min_order_amount).toLocaleString()} required for this code`,
    });
  }

  let discount = Math.round((amount * promo.discount_percent) / 100);
  if (promo.max_discount !== null) {
    discount = Math.min(discount, Number(promo.max_discount));
  }

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discount_percent: promo.discount_percent,
    max_discount: promo.max_discount,
    discount_amount: discount,
    final_amount: amount - discount,
  });
}
