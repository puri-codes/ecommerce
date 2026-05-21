'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { useCartStore } from '@/lib/store';

type FormData = {
  fullName: string;
  phone: string;
  address: string;
};

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const [formData, setFormData] = useState<FormData>({ fullName: '', phone: '', address: '' });
  const [phoneError, setPhoneError] = useState('');
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    setFormData((d) => ({ ...d, phone: digits }));
    if (digits.length > 0 && digits.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
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
        }),
      });

      if (!res.ok) throw new Error('Failed to place order');

      const order = await res.json();
      setOrderId(order.id);
      clearCart();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (orderId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-semibold mb-3 text-black">Order Placed!</h1>
          <p className="text-[#696969] text-sm mb-1">
            Thank you, <span className="font-medium text-black">{formData.fullName}</span>.
          </p>
          <p className="text-xs text-[#aaa] mb-6">Order ref: {orderId.slice(0, 8).toUpperCase()}</p>

          {/* Follow-up notice */}
          <div className="bg-[#EDE735] px-5 py-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">
                We will follow up on call to confirm your order and arrange delivery. Please keep your phone
                reachable on <span className="font-bold">{formData.phone}</span>.
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

  // ── Checkout form ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold mb-8">Checkout</h1>

      <div className="flex flex-col md:flex-row gap-12">

        {/* Form */}
        <div className="flex-1 order-2 md:order-1">
          <h2 className="text-xl font-medium mb-6">Contact Information</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Full name */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#696969] mb-2">
                Full Name <span className="text-[#FA5D42]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData((d) => ({ ...d, fullName: e.target.value }))}
                className="w-full border-b border-gray-300 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent"
                placeholder="Ram Prasad Sharma"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#696969] mb-2">
                Phone Number <span className="text-[#FA5D42]">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full border-b py-2.5 text-sm outline-none transition-colors bg-transparent ${
                  phoneError ? 'border-[#FA5D42]' : 'border-gray-300 focus:border-black'
                }`}
                placeholder="98XXXXXXXX"
                maxLength={10}
              />
              {phoneError ? (
                <p className="mt-1.5 text-[11px] text-[#FA5D42]">{phoneError}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-[#aaa]">Enter your 10-digit Nepal mobile number</p>
              )}
            </div>

            {/* Address — optional */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#696969] mb-2">
                Address <span className="text-[#aaa] normal-case tracking-normal font-normal">· optional</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
                rows={2}
                className="w-full border-b border-gray-300 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent resize-none"
                placeholder="Kathmandu, Ward 5, Thamel…"
              />
            </div>

            {/* Follow-up note */}
            <div className="bg-gray-50 border border-gray-100 px-4 py-3 flex items-start gap-3 mt-2">
              <Phone className="h-4 w-4 shrink-0 mt-0.5 text-[#696969]" />
              <p className="text-[13px] text-[#696969] leading-relaxed">
                After placing your order, our team will <strong className="text-black">follow up on call</strong> to
                confirm and arrange delivery.
              </p>
            </div>

            <button
              type="submit"
              disabled={items.length === 0 || busy}
              className="mt-4 bg-black text-white py-4 text-sm font-medium tracking-wide hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? 'Placing order…' : 'Place Order'}
            </button>

            {items.length === 0 && (
              <p className="text-center text-sm text-[#696969]">
                Your cart is empty.{' '}
                <Link href="/" className="underline hover:text-black">
                  Browse products
                </Link>
              </p>
            )}
          </form>
        </div>

        {/* Order summary */}
        <div className="md:w-[360px] order-1 md:order-2 shrink-0">
          <div className="bg-gray-50 p-6">
            <h2 className="text-lg font-medium mb-5">Order Summary</h2>

            {items.length === 0 ? (
              <p className="text-sm text-[#696969]">Your cart is empty.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productTitle}
                        className="w-14 h-18 object-cover bg-gray-100 shrink-0"
                        style={{ height: '4.5rem' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-black line-clamp-2">{item.productTitle}</div>
                      <div className="text-[12px] text-[#696969] mt-0.5 space-x-1.5">
                        {item.color && <span>{item.color}</span>}
                        {item.size && <span>· {item.size}</span>}
                        <span>· Qty {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-[13px] font-medium shrink-0">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-base font-semibold text-black">
                  <span>Total</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
