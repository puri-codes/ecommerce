'use client';
import Link from 'next/link';
import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

const PROMO_CODE = 'SAVE10';

function PromoPopup({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(PROMO_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Yellow header */}
        <div className="bg-[#EDE735] px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-black/50 hover:text-black transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-[11px] uppercase tracking-[0.25em] text-black/60 mb-1">Your exclusive offer</p>
          <h3 className="text-[22px] font-semibold text-black leading-tight">10% off your first order</h3>
        </div>

        {/* Code */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          <p className="text-[13px] text-[#696969] text-center">
            Use this code at checkout to get 10% off your purchase.
          </p>

          <div className="w-full flex items-center gap-2 border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
            <span className="flex-1 text-center text-[22px] font-mono font-bold tracking-[0.2em] text-black select-all">
              {PROMO_CODE}
            </span>
            <button
              onClick={copyCode}
              className="shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-[#696969] hover:text-black transition-colors"
            >
              {copied
                ? <><Check className="h-3.5 w-3.5 text-[#027D48]" /><span className="text-[#027D48]">Copied</span></>
                : <><Copy className="h-3.5 w-3.5" />Copy</>}
            </button>
          </div>

          <p className="text-[11px] text-[#aaa] text-center">
            Valid on any order. Cannot be combined with other offers.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 text-[13px] font-medium hover:bg-black/80 transition-colors"
          >
            Shop now →
          </button>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const [form,    setForm]    = useState({ name: '', phone: '', email: '' });
  const [busy,    setBusy]    = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.name.trim(),
          phone:   form.phone.trim(),
          email:   form.email.trim() || null,
          message: `Promo subscription — requested code ${PROMO_CODE}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      setForm({ name: '', phone: '', email: '' });
      setShowPopup(true);
    } catch {
      setError('Could not subscribe. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const INP = 'w-full bg-transparent outline-none py-2 text-[#000] placeholder:text-[#696969] text-sm';
  const LBL = 'text-[10px] uppercase tracking-[0.18em] text-[#696969] mb-1';

  return (
    <>
      {showPopup && <PromoPopup onClose={() => setShowPopup(false)} />}

      <footer className="mt-auto">

        {/* Subscribe strip */}
        <div className="bg-[#f5f5f5] py-16 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">

            <div className="max-w-xs shrink-0">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#696969] mb-2">Exclusive offer</p>
              <h3 className="text-[28px] font-semibold text-black leading-tight">
                Save 10% on your purchase today.
              </h3>
              <p className="text-[13px] text-[#696969] mt-3 leading-relaxed">
                Subscribe and get an instant discount code for your first order.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-5 w-full md:max-w-md">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className={LBL}>Name <span className="text-[#FA5D42]">*</span></p>
                  <div className="border-b border-[#000]">
                    <input
                      required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name" className={INP}
                    />
                  </div>
                </div>
                <div>
                  <p className={LBL}>Phone <span className="text-[#FA5D42]">*</span></p>
                  <div className="border-b border-[#000]">
                    <input
                      required value={form.phone} type="tel"
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="98XXXXXXXX" className={INP}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className={LBL}>
                  Email <span className="text-[#aaa] normal-case tracking-normal font-normal">· optional</span>
                </p>
                <div className="border-b border-[#000]">
                  <input
                    value={form.email} type="email"
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com" className={INP}
                  />
                </div>
              </div>

              {error && <p className="text-[12px] text-[#FA5D42]">{error}</p>}

              <button
                type="submit" disabled={busy}
                className="self-start bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-black/90 transition-colors disabled:opacity-50"
              >
                {busy ? 'Subscribing…' : 'Get my 10% off'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#000] text-[#e5e5e5] py-14 px-4">
          <div className="max-w-7xl mx-auto flex flex-col items-center">

            {/* Logo */}
            <Link href="/" className="mb-10">
              <img src="/logo.png" alt="DANANA" className="h-14 w-auto object-contain" />
            </Link>

            {/* Nav columns */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12 text-center sm:text-left">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#696969] mb-4">Shop</p>
                <div className="flex flex-col gap-3 text-sm text-[#bbb]">
                  <Link href="/all-products" className="hover:text-white transition-colors">All Products</Link>
                  <Link href="/all-products?gender=male" className="hover:text-white transition-colors">Men</Link>
                  <Link href="/all-products?gender=female" className="hover:text-white transition-colors">Women</Link>
                  <Link href="/all-products?gender=unisex" className="hover:text-white transition-colors">Unisex</Link>
                  <Link href="/combos" className="hover:text-white transition-colors">Combos</Link>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#696969] mb-4">Info</p>
                <div className="flex flex-col gap-3 text-sm text-[#bbb]">
                  <Link href="/about" className="hover:text-white transition-colors">About</Link>
                  <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
                  <Link href="/payment-options" className="hover:text-white transition-colors">Payment Options</Link>
                  <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#696969] mb-4">Orders</p>
                <div className="flex flex-col gap-3 text-sm text-[#bbb]">
                  <Link href="/view-orders" className="hover:text-white transition-colors">View Orders</Link>
                  <Link href="/checkout" className="hover:text-white transition-colors">Checkout</Link>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#696969] mb-4">Follow Us</p>
                <div className="flex flex-col gap-3 text-sm text-[#bbb]">
                  <a href="https://www.instagram.com/danana_wears/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
                  <a href="https://www.instagram.com/danana_wears/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
                </div>
              </div>
            </div>

            {/* Divider + copyright */}
            <div className="w-full border-t border-[#222] pt-8 text-center">
              <p className="text-[#696969] text-sm">© 2026 DANANA. All rights reserved.</p>
            </div>

          </div>
        </div>
      </footer>
    </>
  );
}
