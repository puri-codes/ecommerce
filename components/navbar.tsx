'use client';
import Link from 'next/link';
import { Search, ShoppingCart, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/lib/store';
import { CartDrawer } from './cart-drawer';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setIsOpen: setCartOpen } = useCartStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cartItemsCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full h-20 flex items-center justify-between relative">
          <div className="flex items-center gap-6 flex-1 text-sm font-medium">
            <button
              onClick={() => setIsMenuOpen((value) => !value)}
              className="p-2 -ml-2 flex items-center justify-center"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="relative block h-5 w-5" aria-hidden="true">
                <span
                  className={`absolute left-0 top-[4px] h-[1.5px] w-5 bg-black transition-transform duration-200 ease-out ${
                    isMenuOpen ? 'translate-y-[4px] rotate-45' : 'translate-y-0 rotate-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[12px] h-[1.5px] w-5 bg-black transition-transform duration-200 ease-out ${
                    isMenuOpen ? '-translate-y-[4px] -rotate-45' : 'translate-y-0 rotate-0'
                  }`}
                />
              </span>
            </button>
            <div className="hidden md:flex gap-6">
              <Link href="#" className="hover:opacity-70">Women</Link>
              <Link href="#" className="hover:opacity-70">Men</Link>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:static md:translate-x-0 md:translate-y-0 md:flex-1 md:flex md:justify-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-serif tracking-widest font-normal">DANANA</h1>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-4 flex-1">
            <button className="p-2" onClick={() => setIsSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 relative flex items-center justify-center bg-white rounded-md" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden border-t border-gray-100 bg-white transition-[max-height,opacity,transform] duration-300 ease-out ${
            isMenuOpen ? 'max-h-[36rem] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-start">
              <div>
                <h3 className="text-2xl font-medium text-black mb-5">Info</h3>
                <div className="flex flex-col gap-5 text-[15px] text-black">
                  <Link href="/returns" onClick={() => setIsMenuOpen(false)} className="hover:opacity-70">Returns</Link>
                  <Link href="/shipping" onClick={() => setIsMenuOpen(false)} className="hover:opacity-70">Shipping</Link>
                  <Link href="/order-cancellation" onClick={() => setIsMenuOpen(false)} className="hover:opacity-70">Order cancellation</Link>
                  <Link href="/payment-options" onClick={() => setIsMenuOpen(false)} className="hover:opacity-70">Payment options</Link>
                  <Link href="/about" onClick={() => setIsMenuOpen(false)} className="hover:opacity-70">About</Link>
                  <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="hover:opacity-70">Contact</Link>
                  <Link href="/faq" onClick={() => setIsMenuOpen(false)} className="hover:opacity-70">FAQ</Link>
                </div>
              </div>

              <div className="lg:pl-6">
                <h3 className="text-2xl font-medium text-black mb-5">DANANA&apos;s store</h3>
                <Link href="/all-products" onClick={() => setIsMenuOpen(false)} className="block group">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                    <img
                      src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1600"
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      alt="Clothing store"
                    />
                  </div>
                  <span className="mt-3 block text-[15px] text-black hover:opacity-70">Discover all</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && <div className="fixed inset-0 top-20 z-30 bg-black/10 backdrop-blur-[1px]" onClick={() => setIsMenuOpen(false)} />}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col" onClick={(e) => {
          if (e.target === e.currentTarget) setIsSearchOpen(false);
        }}>
          <div className="p-4 flex justify-end">
             <button onClick={() => setIsSearchOpen(false)}>
                <X className="w-6 h-6" />
             </button>
          </div>
          <div className="max-w-2xl w-full mx-auto mt-20 px-6">
             <div className="relative border-b-2 border-black pb-2">
                <Search className="absolute left-0 top-1 w-6 h-6 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full text-2xl outline-none bg-transparent pl-10"
                  autoFocus
                />
             </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
