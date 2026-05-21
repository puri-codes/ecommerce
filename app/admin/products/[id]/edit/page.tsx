import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { ensureAdminTables, getAdminBySessionToken, pool } from '@/lib/db';
import { AdminShell } from '@/components/admin-shell';
import { AdminProductForm } from '@/components/admin-product-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  await ensureAdminTables();
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const admin = token ? await getAdminBySessionToken(token) : null;

  if (!admin) redirect('/admin');

  const { id } = await params;
  const result = await pool.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
  const product = result.rows[0];

  if (!product) notFound();

  return (
    <AdminShell adminEmail={admin.email}>
      <AdminProductForm product={product} />
    </AdminShell>
  );
}
