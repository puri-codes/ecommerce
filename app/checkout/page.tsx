'use client';
import { useCartStore } from '@/lib/store';
import Link from 'next/link';
import { useState } from 'react';

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save order locally
    if (typeof window !== 'undefined') {
      const order = {
        ...formData,
        items,
        total: subtotal,
        date: new Date().toISOString()
      };
      const existingOrders = JSON.parse(localStorage.getItem('danana_orders') || '[]');
      localStorage.setItem('danana_orders', JSON.stringify([...existingOrders, order]));
    }
    
    clearCart();
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl font-semibold mb-4 text-black">Order Confirmed!</h1>
          <p className="text-[#696969] mb-8">Thank you, {formData.fullName}. Your order has been placed successfully and will be processed soon.</p>
          <Link href="/">
            <button className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-black/90">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold mb-8">Checkout</h1>
      
      <div className="flex flex-col md:flex-row gap-12">
        <div className="flex-1 order-2 md:order-1">
          <h2 className="text-xl font-medium mb-6">Contact Information</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-[#696969] mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-sm outline-none focus:border-black"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#696969] mb-1">Email</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-sm outline-none focus:border-black"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#696969] mb-1">Phone Number</label>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-sm outline-none focus:border-black"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <button 
              type="submit" 
              className="mt-6 bg-black text-white py-4 rounded-sm font-medium hover:bg-black/90 disabled:opacity-50"
              disabled={items.length === 0}
            >
              Place Order
            </button>
          </form>
        </div>

        <div className="md:w-[400px] order-1 md:order-2">
          <div className="bg-gray-50 p-6 rounded-sm">
            <h2 className="text-xl font-medium mb-6">Order Summary</h2>
            {items.length === 0 ? (
              <p className="text-[#696969]">Your cart is empty.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} alt={item.productTitle} className="w-16 h-20 object-cover" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-black line-clamp-2">{item.productTitle}</div>
                      <div className="text-[#696969] mt-1 space-x-2">
                        {item.color && <span>{item.color}</span>}
                        {item.size && <span>{item.size}</span>}
                      </div>
                      <div className="mt-1 font-medium">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">${item.price * item.quantity}</div>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center text-lg font-medium text-black">
                  <span>Total</span>
                  <span>${subtotal}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
