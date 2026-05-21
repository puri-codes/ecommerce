'use client';
import type { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Package, ShoppingBag, LogOut, Layers, Tag } from 'lucide-react';

type Props = { adminEmail: string; children: ReactNode };

const NAV = [
  { label: 'Products',    href: '/admin',              icon: Package,    match: (p: string) => p === '/admin' || p.startsWith('/admin/products') },
  { label: 'Combos',      href: '/admin/combos',       icon: Layers,     match: (p: string) => p.startsWith('/admin/combos') },
  { label: 'Promo Codes', href: '/admin/promo-codes',  icon: Tag,        match: (p: string) => p.startsWith('/admin/promo-codes') },
  { label: 'Orders',      href: '/admin/orders',       icon: ShoppingBag, match: (p: string) => p.startsWith('/admin/orders') },
];

export function AdminShell({ adminEmail, children }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-black flex">
      <aside className="w-[220px] shrink-0 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen overflow-hidden">

        <div className="px-5 py-6 border-b border-gray-100 shrink-0">
          <h1 className="text-xl font-serif tracking-widest font-normal">DANANA</h1>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#696969] mt-0.5">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#aaa] px-2 mb-3">Tables</p>
          <div className="flex flex-col gap-1">
            {NAV.map(({ label, href, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <button key={href} onClick={() => router.push(href)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                    active ? 'bg-black text-white' : 'text-black hover:bg-gray-50'
                  }`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-gray-100 px-4 py-4 shrink-0">
          <p className="text-[11px] text-[#696969] truncate mb-3">{adminEmail}</p>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2 text-[13px] hover:border-black transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto min-h-screen">{children}</div>
    </div>
  );
}
