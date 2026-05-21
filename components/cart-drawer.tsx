'use client';
import { useCartStore } from '@/lib/store';
import { X, Minus, Plus, Layers } from 'lucide-react';
import Link from 'next/link';

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem } = useCartStore();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`relative w-full max-w-[400px] bg-white h-full shadow-xl flex flex-col shrink-0 z-10 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-medium flex items-center gap-2">
            Your Cart
            <span className="bg-gray-100 text-sm px-2 py-0.5 rounded-full">{items.length}</span>
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#696969]">
              <h3 className="text-xl font-medium text-black mb-2">Your Cart is Empty</h3>
              <p className="text-sm">Add some items to the cart.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-32 bg-gray-100 relative overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    {item.isCombo && (
                      <span className="absolute top-1 left-1 bg-[#EDE735] text-black text-[9px] font-bold px-1.5 py-0.5 leading-none">
                        BUNDLE
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        {item.isCombo ? (
                          <span className="font-medium text-sm line-clamp-2">{item.productTitle}</span>
                        ) : (
                          <Link
                            href={`/product/${item.productId}`}
                            onClick={() => setIsOpen(false)}
                            className="font-medium text-sm hover:underline line-clamp-2"
                          >
                            {item.productTitle}
                          </Link>
                        )}
                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-black shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Variant info */}
                      {item.isCombo && item.comboItems ? (
                        <div className="flex flex-col gap-0.5 mt-1.5">
                          {item.comboItems.map((ci, i) => (
                            <div key={i} className="text-[11px] text-[#696969]">
                              {ci.productName}&ensp;—&ensp;
                              <span className="font-medium text-black">{ci.size}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 mt-1 space-x-2">
                          {item.color && <span>{item.color}</span>}
                          {item.color && item.size && <span>|</span>}
                          {item.size && <span>{item.size}</span>}
                        </div>
                      )}
                    </div>

                    {/* Quantity + price */}
                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center border border-gray-200 h-8">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-2 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold text-sm">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-5">
            <span className="font-medium">Subtotal</span>
            <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
          </div>
          <Link
            href="/checkout"
            onClick={(e) => { if (items.length === 0) e.preventDefault(); else setIsOpen(false); }}
          >
            <button
              disabled={items.length === 0}
              className="w-full bg-black text-white py-4 font-medium hover:bg-black/90 transition-colors disabled:bg-[#888] disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
