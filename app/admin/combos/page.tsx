import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ensureAdminTables, getAdminBySessionToken } from '@/lib/db';
import { AdminShell } from '@/components/admin-shell';
import { AdminCombos } from '@/components/admin-combos';

export const dynamic = 'force-dynamic';

export default async function CombosPage() {
  await ensureAdminTables();
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const admin = token ? await getAdminBySessionToken(token) : null;
  if (!admin) redirect('/admin');

  return (
    <AdminShell adminEmail={admin.email}>
      <AdminCombos />
    </AdminShell>
  );
}
