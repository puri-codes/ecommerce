'use client';
import Link from 'next/link';
import { Search, ShoppingCart, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { CartDrawer } from './cart-drawer';
import type { DbProduct } from '@/lib/types';

const GENDER_LINKS = [
  { label: 'Men',    href: '/all-products?gender=male'   },
  { label: 'Women',  href: '/all-products?gender=female' },
  { label: 'Unisex', href: '/all-products?gender=unisex' },
  { label: 'Combos', href: '/combos'                     },
];

const INFO_LINKS = [
  { label: 'View Orders',     href: '/view-orders'     },
  { label: 'Payment options', href: '/payment-options' },
  { label: 'About',           href: '/about'           },
  { label: 'Contact',         href: '/contact'         },
  { label: 'FAQ',             href: '/faq'             },
];

export function Navbar() {
  const router = useRouter();
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [allProducts,  setAllProducts]  = useState<DbProduct[]>([]);
  const [results,      setResults]      = useState<DbProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setIsOpen: setCartOpen } = useCartStore();
  const cartItemsCount = useCartStore(
    (state) => state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  // Fetch products once when search opens
  useEffect(() => {
    if (!isSearchOpen) return;
    if (allProducts.length > 0) return;
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setAllProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isSearchOpen, allProducts.length]);

  // Filter as user types
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    setResults(
      allProducts
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.category ?? '').toLowerCase().includes(q) ||
            (p.description ?? '').toLowerCase().includes(q)
        )
        .slice(0, 6)
    );
  }, [searchQuery, allProducts]);

  function openSearch() {
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery('');
    setResults([]);
  }

  function navigateToSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/all-products?q=${encodeURIComponent(q)}`);
    closeSearch();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigateToSearch();
  }

  function handleResultClick() {
    closeSearch();
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
              <img src="/logo.png" alt="DANANA" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          {/* Right: search + cart */}
          <div className="flex items-center justify-end gap-1 sm:gap-4 flex-1">
            <button className="p-2" onClick={openSearch}>
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
        <div className={`border-t border-gray-100 bg-white transition-[max-height,opacity] duration-300 ease-out ${
          isMenuOpen ? 'max-h-[40rem] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1.1fr] items-start">

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

              <div className="hidden md:block lg:pl-4">
                <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#696969] mb-5">Store</h3>
                <Link href="/all-products" onClick={closeMenu} className="block group">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                    <img
                      src="/england_front.png"
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
        <div className="fixed inset-0 z-50 bg-white/96 backdrop-blur-md flex flex-col">

          {/* Top bar */}
          <div className="border-b border-gray-100">
            <form
              onSubmit={handleSearch}
              className="max-w-2xl w-full mx-auto px-4 sm:px-6 h-20 flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-[#aaa] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="flex-1 text-lg outline-none bg-transparent"
                autoFocus
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#aaa] hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeSearch}
                className="ml-2 text-[#aaa] hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-4">

              {results.length > 0 ? (
                <>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#696969] mb-3">Products</p>
                  <ul>
                    {results.map((p) => {
                      const image = p.image_groups?.[0]?.images?.[0];
                      const price = Number(p.base_price);
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/product/${p.slug}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-4 py-3 border-b border-gray-50 hover:bg-gray-50 -mx-2 px-2 transition-colors"
                          >
                            <div className="w-12 h-14 bg-gray-100 shrink-0 overflow-hidden">
                              {image && (
                                <img src={image} alt={p.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] text-black truncate">{p.name}</p>
                              {p.category && (
                                <p className="text-[12px] text-[#696969]">{p.category}</p>
                              )}
                            </div>
                            <span className="text-[14px] text-[#FA5D42] font-medium shrink-0">
                              Rs. {price.toLocaleString()}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {/* See all results */}
                  <button
                    onClick={navigateToSearch}
                    className="mt-4 w-full py-3 border border-gray-200 text-sm text-[#696969] hover:border-black hover:text-black transition-colors"
                  >
                    See all results for &ldquo;{searchQuery}&rdquo;
                  </button>
                </>
              ) : searchQuery.trim() ? (
                <p className="text-sm text-[#696969] py-6">No products found for &ldquo;{searchQuery}&rdquo;</p>
              ) : (
                <p className="text-sm text-[#696969] py-6">Start typing to search…</p>
              )}
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
