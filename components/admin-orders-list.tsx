'use client';
import { useCallback, useEffect, useState } from 'react';
import { Phone, RefreshCw, ShoppingBag, MapPin } from 'lucide-react';

type OrderItem = {
  productId: string;
  productTitle: string;
  price: number;
  image?: string;
  color?: string;
  size?: string;
  quantity: number;
};

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string | null;
  items: OrderItem[];
  subtotal: number;
  status: 'pending' | 'contacted' | 'completed';
  created_at: string;
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  contacted: { label: 'Contacted', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
} as const;

export function AdminOrdersList() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function updateStatus(orderId: string, status: Order['status']) {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-medium">Orders</h2>
          <p className="text-[13px] text-[#696969] mt-0.5">
            {loading
              ? 'Loading…'
              : `${orders.length} total · ${orders.filter((o) => o.status === 'pending').length} pending`}
          </p>
        </div>
        <button onClick={loadOrders} disabled={loading}
          className="flex items-center gap-2 border border-gray-200 px-3 py-2 text-[13px] hover:border-black transition-colors disabled:opacity-40">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[13px] text-[#696969]">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <ShoppingBag className="h-12 w-12 text-gray-200" />
            <p className="text-[13px] text-[#696969]">No orders yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-3xl">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              const date = new Date(order.created_at);
              const dateStr = date.toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });
              const timeStr = date.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={order.id} className="bg-white border border-gray-100 p-5 flex flex-col gap-4">

                  {/* Date + status */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] text-[#aaa] uppercase tracking-wide">{dateStr} · {timeStr}</div>
                      <div className="text-[11px] text-[#aaa] mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-wide font-medium border shrink-0 ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Customer */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium">{order.customer_name}</div>
                      <a href={`tel:${order.phone}`}
                        className="inline-flex items-center gap-1.5 text-[13px] text-black hover:text-[#FA5D42] transition-colors mt-1">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {order.phone}
                      </a>
                      {order.address && (
                        <div className="flex items-start gap-1.5 text-[13px] text-[#696969] mt-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{order.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-0.5">Total</div>
                      <div className="text-[16px] font-semibold">Rs. {Number(order.subtotal).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Items */}
                  {(order.items ?? []).length > 0 && (
                    <div className="border-t border-gray-50 pt-3 flex flex-col gap-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-[13px]">
                          {item.image && (
                            <img src={item.image} alt={item.productTitle} className="w-8 h-8 object-cover bg-gray-100 shrink-0" />
                          )}
                          <span className="flex-1 truncate">{item.productTitle}</span>
                          <span className="text-[#696969] shrink-0">
                            {[item.color, item.size].filter(Boolean).join(' · ')} &times; {item.quantity}
                          </span>
                          <span className="font-medium shrink-0">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-50 pt-3 flex flex-wrap gap-2">
                    {order.status !== 'contacted' && order.status !== 'completed' && (
                      <button onClick={() => updateStatus(order.id, 'contacted')}
                        className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 text-[12px] hover:bg-blue-100 transition-colors">
                        <Phone className="h-3 w-3" /> Mark contacted
                      </button>
                    )}
                    {order.status !== 'completed' && (
                      <button onClick={() => updateStatus(order.id, 'completed')}
                        className="flex items-center gap-1.5 border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 text-[12px] hover:bg-green-100 transition-colors">
                        ✓ Mark completed
                      </button>
                    )}
                    {order.status !== 'pending' && (
                      <button onClick={() => updateStatus(order.id, 'pending')}
                        className="border border-gray-200 text-[#696969] px-3 py-1.5 text-[12px] hover:border-black transition-colors">
                        Reset to pending
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
