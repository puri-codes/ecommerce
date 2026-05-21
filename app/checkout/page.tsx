'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Phone, Tag, X, Layers } from 'lucide-react';
import { useCartStore } from '@/lib/store';

type FormData    = { fullName: string; phone: string; address: string };
type PromoResult = { code: string; discount_percent: number; discount_amount: number };

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const [formData,    setFormData]    = useState<FormData>({ fullName: '', phone: '', address: '' });
  const [phoneError,  setPhoneError]  = useState('');
  const [busy,        setBusy]        = useState(false);
  const [orderId,     setOrderId]     = useState<string | null>(null);

  const [promoInput,   setPromoInput]   = useState('');
  const [promoResult,  setPromoResult]  = useState<PromoResult | null>(null);
  const [promoError,   setPromoError]   = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const discount   = promoResult?.discount_amount ?? 0;
  const finalTotal = subtotal - discount;

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    setFormData((d) => ({ ...d, phone: digits }));
    setPhoneError(
      digits.length > 0 && digits.length < 10 ? 'Phone number must be exactly 10 digits' : ''
    );
  }

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res  = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, order_amount: subtotal }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.error ?? 'Invalid promo code');
        setPromoResult(null);
      } else {
        setPromoResult(data);
      }
    } catch {
      setPromoError('Could not validate. Try again.');
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setPromoResult(null);
    setPromoInput('');
    setPromoError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.fullName,
          phone: formData.phone,
          address: formData.address || null,
          items,
          subtotal,
          promo_code: promoResult?.code ?? null,
          discount_amount: discount,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const order = await res.json();
      setOrderId(order.id);
      clearCart();
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (orderId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold mb-3">Order Placed!</h1>
          <p className="text-[#696969] text-sm mb-1">
            Thank you, <span className="font-medium text-black">{formData.fullName}</span>.
          </p>
          <p className="text-xs text-[#aaa] mb-4">Ref: {orderId.slice(0, 8).toUpperCase()}</p>
          {discount > 0 && (
            <p className="text-[13px] text-[#027D48] font-medium mb-4">
              You saved Rs. {discount.toLocaleString()} with code {promoResult?.code}!
            </p>
          )}
          <div className="bg-[#EDE735] px-5 py-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">
                We will follow up on call to confirm your order and arrange delivery.
                Keep your phone reachable on <span className="font-bold">{formData.phone}</span>.
              </p>
            </div>
          </div>
          <Link href="/">
            <button className="bg-black text-white px-8 py-3 text-sm font-medium hover:bg-black/80 transition-colors">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold mb-8">Checkout</h1>

      <div className="flex flex-col md:flex-row gap-12">

        {/* ── Contact form ── */}
        <div className="flex-1 order-2 md:order-1">
          <h2 className="text-xl font-medium mb-6">Contact Information</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#696969] mb-2">
                Full Name <span className="text-[#FA5D42]">*</span>
              </label>
              <input type="text" required value={formData.fullName}
                onChange={(e) => setFormData((d) => ({ ...d, fullName: e.target.value }))}
                className="w-full border-b border-gray-300 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent"
                placeholder="Ram Prasad Sharma" />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#696969] mb-2">
                Phone Number <span className="text-[#FA5D42]">*</span>
              </label>
              <input type="tel" inputMode="numeric" required value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full border-b py-2.5 text-sm outline-none transition-colors bg-transparent ${
                  phoneError ? 'border-[#FA5D42]' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="98XXXXXXXX" maxLength={10} />
              {phoneError
                ? <p className="mt-1.5 text-[11px] text-[#FA5D42]">{phoneError}</p>
                : <p className="mt-1.5 text-[11px] text-[#aaa]">10-digit Nepal mobile number</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#696969] mb-2">
                Address <span className="text-[#aaa] normal-case tracking-normal font-normal">· optional</span>
              </label>
              <textarea value={formData.address}
                onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
                rows={2}
                className="w-full border-b border-gray-300 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent resize-none"
                placeholder="Kathmandu, Ward 5, Thamel…" />
            </div>

            <div className="bg-gray-50 border border-gray-100 px-4 py-3 flex items-start gap-3 mt-1">
              <Phone className="h-4 w-4 shrink-0 mt-0.5 text-[#696969]" />
              <p className="text-[13px] text-[#696969] leading-relaxed">
                After placing your order, our team will{' '}
                <strong className="text-black">follow up on call</strong> to confirm and arrange delivery.
              </p>
            </div>

            <button type="submit" disabled={items.length === 0 || busy}
              className="mt-4 bg-black text-white py-4 text-sm font-medium tracking-wide hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {busy
                ? 'Placing order…'
                : `Place Order · Rs. ${finalTotal.toLocaleString()}`}
            </button>

            {items.length === 0 && (
              <p className="text-center text-sm text-[#696969]">
                Your cart is empty.{' '}
                <Link href="/" className="underline hover:text-black">Browse products</Link>
              </p>
            )}
          </form>
        </div>

        {/* ── Order summary ── */}
        <div className="md:w-[380px] order-1 md:order-2 shrink-0">

          {/* ── Promo code — prominent section ── */}
          <div className="border border-[#EDE735] bg-[#FEFDE8] p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-black shrink-0" />
              <p className="text-[13px] font-semibold text-black uppercase tracking-wide">
                Got a promo code?
              </p>
            </div>

            {promoResult ? (
              <div className="flex items-center justify-between bg-white border border-[#027D48] px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-[#027D48] font-mono">{promoResult.code}</p>
                  <p className="text-[11px] text-[#027D48]">
                    {promoResult.discount_percent}% off — you save Rs. {discount.toLocaleString()}
                  </p>
                </div>
                <button onClick={removePromo} className="text-[#696969] hover:text-black ml-3">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
                    placeholder="Enter code e.g. SAVE20"
                    className="flex-1 border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black bg-white font-mono placeholder:font-sans placeholder:text-[#aaa] tracking-widest uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={!promoInput.trim() || promoLoading}
                    className="bg-black text-white px-4 py-2.5 text-[12px] font-medium hover:bg-black/80 transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {promoLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="mt-1.5 text-[11px] text-[#FA5D42]">{promoError}</p>
                )}
              </div>
            )}
          </div>

          {/* ── Summary box ── */}
          <div className="bg-gray-50 p-6">
            <h2 className="text-lg font-medium mb-5">Order Summary</h2>

            {items.length === 0 ? (
              <p className="text-sm text-[#696969]">Your cart is empty.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.productTitle}
                        className="w-14 object-cover bg-gray-100 shrink-0"
                        style={{ height: '4.5rem' }} />
                    ) : (
                      <div className="w-14 bg-gray-100 shrink-0 flex items-center justify-center" style={{ height: '4.5rem' }}>
                        <Layers className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1">
                        <div className="text-[13px] font-medium text-black line-clamp-2 flex-1">
                          {item.productTitle}
                        </div>
                        {item.isCombo && (
                          <span className="shrink-0 bg-[#EDE735] text-black text-[9px] font-bold px-1.5 py-0.5">
                            BUNDLE
                          </span>
                        )}
                      </div>

                      {item.isCombo && item.comboItems ? (
                        <div className="mt-1 flex flex-col gap-0.5">
                          {item.comboItems.map((ci, i) => (
                            <div key={i} className="text-[11px] text-[#696969]">
                              {ci.productName} — <span className="font-medium text-black">{ci.size}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[12px] text-[#696969] mt-0.5 space-x-1.5">
                          {item.color && <span>{item.color}</span>}
                          {item.size && <span>· {item.size}</span>}
                          <span>· Qty {item.quantity}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[13px] font-medium shrink-0">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#696969]">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  {promoResult && (
                    <div className="flex justify-between text-[#027D48] font-medium">
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        {promoResult.code} ({promoResult.discount_percent}% off)
                      </span>
                      <span>-Rs. {discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-base font-semibold text-black border-t border-gray-200 pt-3 mt-1">
                    <span>Total</span>
                    <span>Rs. {finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
