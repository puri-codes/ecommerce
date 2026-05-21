'use client';
import Link from 'next/link';
import { Search, ShoppingCart, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { CartDrawer } from './cart-drawer';

const GENDER_LINKS = [
  { label: 'Men',    href: '/all-products?gender=male'   },
  { label: 'Women',  href: '/all-products?gender=female' },
  { label: 'Unisex', href: '/all-products?gender=unisex' },
  { label: 'Combos', href: '/combos'                     },
];

const INFO_LINKS = [
  { label: 'Returns',            href: '/returns'            },
  { label: 'Shipping',           href: '/shipping'           },
  { label: 'Order cancellation', href: '/order-cancellation' },
  { label: 'Payment options',    href: '/payment-options'    },
  { label: 'About',              href: '/about'              },
  { label: 'Contact',            href: '/contact'            },
  { label: 'FAQ',                href: '/faq'                },
];

export function Navbar() {
  const router = useRouter();
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const { setIsOpen: setCartOpen } = useCartStore();
  const cartItemsCount = useCartStore(
    (state) => state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/all-products?q=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  }

  function closeMenu() { setIsMenuOpen(false); }

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full h-20 flex items-center justify-between relative">

          {/* Left: hamburger + desktop gender links */}
          <div className="flex items-center gap-6 flex-1 text-sm font-medium">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="p-2 -ml-2 flex items-center justify-center"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="relative block h-5 w-5" aria-hidden="true">
                <span className={`absolute left-0 top-[4px] h-[1.5px] w-5 bg-black transition-transform duration-200 ease-out ${
                  isMenuOpen ? 'translate-y-[4px] rotate-45' : ''
                }`} />
                <span className={`absolute left-0 top-[12px] h-[1.5px] w-5 bg-black transition-transform duration-200 ease-out ${
                  isMenuOpen ? '-translate-y-[4px] -rotate-45' : ''
                }`} />
              </span>
            </button>

            {/* Desktop gender links */}
            <div className="hidden md:flex gap-6">
              {GENDER_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="hover:opacity-60 transition-opacity">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Centre: brand */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:static md:translate-x-0 md:translate-y-0 md:flex-1 md:flex md:justify-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-serif tracking-widest font-normal">DANANA</h1>
            </Link>
          </div>

          {/* Right: search + cart */}
          <div className="flex items-center justify-end gap-1 sm:gap-4 flex-1">
            <button className="p-2" onClick={() => setIsSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 relative flex items-center justify-center bg-white rounded-md"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Hamburger dropdown ── */}
        <div className={`overflow-hidden border-t border-gray-100 bg-white transition-[max-height,opacity] duration-300 ease-out ${
          isMenuOpen ? 'max-h-[40rem] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1.1fr] items-start">

              {/* Shop by gender */}
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#696969] mb-5">Shop</h3>
                <div className="flex flex-col gap-4 text-[15px] text-black">
                  <Link href="/all-products" onClick={closeMenu} className="hover:opacity-60 transition-opacity font-medium">
                    All products
                  </Link>
                  {GENDER_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} onClick={closeMenu} className="hover:opacity-60 transition-opacity">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Info links */}
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#696969] mb-5">Info</h3>
                <div className="flex flex-col gap-4 text-[15px] text-black">
                  {INFO_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} onClick={closeMenu} className="hover:opacity-60 transition-opacity">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Store image */}
              <div className="lg:pl-4">
                <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#696969] mb-5">Store</h3>
                <Link href="/all-products" onClick={closeMenu} className="block group">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                    <img
                      src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1600"
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      alt="DANANA store"
                    />
                  </div>
                  <span className="mt-3 block text-[15px] text-black hover:opacity-60 transition-opacity">
                    Discover all
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed inset-0 top-20 z-30 bg-black/10 backdrop-blur-[1px]"
          onClick={closeMenu}
        />
      )}

      {/* ── Search overlay ── */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) setIsSearchOpen(false); }}
        >
          <div className="p-4 flex justify-end">
            <button onClick={() => setIsSearchOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl w-full mx-auto mt-16 px-6">
            <div className="relative border-b-2 border-black pb-2">
              <Search className="absolute left-0 top-1 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full text-2xl outline-none bg-transparent pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-0 top-2 text-gray-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="mt-4 text-sm text-[#696969]">Press Enter to search</p>
          </form>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
