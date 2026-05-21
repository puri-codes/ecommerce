"use client";

import type { FormEvent, ReactNode, ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  LogOut,
  Package,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  ShoppingBag,
  Phone,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { ImageGroupEditor } from './image-group-editor';

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body }
  );

  if (!res.ok) throw new Error('Cloudinary upload failed');

  const data = await res.json();

  // Build the delivery URL from public_id so transformations are never duplicated,
  // regardless of what the upload preset may have already applied to secure_url.
  const publicId: string = data.public_id;
  if (!publicId) throw new Error('Cloudinary response missing public_id');

  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = { size: string; stock: number };
type ImageGroup = { label: string; images: string[] };

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  gender: string;
  base_price: string | number;
  compare_price: string | number | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  is_active: boolean;
  variants: Variant[];
  image_groups: ImageGroup[];
  created_at: string;
  updated_at: string;
};

type FormVariant = { size: string; stock: string };
type FormImageGroup = { label: string; urls: string[] };

type FormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  gender: 'male' | 'female' | 'unisex';
  base_price: string;
  compare_price: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_active: boolean;
  variants: FormVariant[];
  image_groups: FormImageGroup[];
};

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
const CATEGORIES = ['Jersey', 'T-Shirt', 'Hoodie', 'Polo', 'Shorts', 'Jacket', 'Tracksuit', 'Socks', 'Cap', 'Other'];

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  category: 'Jersey',
  gender: 'unisex',
  base_price: '',
  compare_price: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  is_active: true,
  variants: [{ size: 'M', stock: '0' }],
  image_groups: [{ label: '', urls: [] }],
};

// ─── Shared style constants ───────────────────────────────────────────────────

const CLS_INPUT =
  'w-full border-b border-gray-200 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#aaa]';
const CLS_SELECT =
  'w-full border-b border-gray-200 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent appearance-none cursor-pointer';
const CLS_LABEL =
  'block text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? '',
    category: p.category ?? 'Jersey',
    gender: (p.gender as FormState['gender']) ?? 'unisex',
    base_price: String(p.base_price),
    compare_price: p.compare_price ? String(p.compare_price) : '',
    meta_title: p.meta_title ?? '',
    meta_description: p.meta_description ?? '',
    meta_keywords: p.meta_keywords ?? '',
    is_active: p.is_active ?? true,
    variants:
      (p.variants ?? []).length > 0
        ? (p.variants ?? []).map((v) => ({ size: v.size, stock: String(v.stock) }))
        : [{ size: 'M', stock: '0' }],
    image_groups:
      (p.image_groups ?? []).length > 0
        ? (p.image_groups ?? []).map((g) => ({ label: g.label, urls: g.images ?? [] }))
        : [{ label: '', urls: [] }],
  };
}

function getTotalStock(p: Product) {
  return (p.variants ?? []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

function getPrimaryImage(p: Product) {
  return p.image_groups?.[0]?.images?.[0] ?? null;
}

// ─── Root component ───────────────────────────────────────────────────────────

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingGroup, setUploadingGroup] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Orders state
  const [activeTable, setActiveTable] = useState<'products' | 'orders'>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTable === 'orders') loadOrders();
  }, [activeTable, loadOrders]);

  async function updateOrderStatus(orderId: string, status: Order['status']) {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setView('form');
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm(productToForm(p));
    setView('form');
  }

  function closeForm() {
    setView('list');
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  // ── Form state helpers ──────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((c) => ({
      ...c,
      name,
      slug: !c.slug || c.slug === toSlug(c.name) ? toSlug(name) : c.slug,
    }));
  }

  // Variants
  const addVariant = () =>
    setForm((c) => ({ ...c, variants: [...c.variants, { size: 'M', stock: '0' }] }));
  const removeVariant = (i: number) =>
    setForm((c) => ({ ...c, variants: c.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i: number, field: keyof FormVariant, value: string) =>
    setForm((c) => ({
      ...c,
      variants: c.variants.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)),
    }));

  // Image groups
  const addGroup = () =>
    setForm((c) => ({ ...c, image_groups: [...c.image_groups, { label: '', urls: [] }] }));
  const removeGroup = (i: number) =>
    setForm((c) => ({ ...c, image_groups: c.image_groups.filter((_, idx) => idx !== i) }));
  const updateGroupLabel = (i: number, label: string) =>
    setForm((c) => ({
      ...c,
      image_groups: c.image_groups.map((g, idx) => (idx === i ? { ...g, label } : g)),
    }));
  const addImageToGroup = (i: number, url: string) =>
    setForm((c) => ({
      ...c,
      image_groups: c.image_groups.map((g, idx) =>
        idx === i ? { ...g, urls: [...g.urls, url] } : g
      ),
    }));
  const removeImageFromGroup = (gi: number, ii: number) =>
    setForm((c) => ({
      ...c,
      image_groups: c.image_groups.map((g, idx) =>
        idx === gi ? { ...g, urls: g.urls.filter((_, i) => i !== ii) } : g
      ),
    }));

  // ── Cloudinary image upload ──────────────────────────────────────────────────

  function triggerUpload(groupIndex: number) {
    setUploadingGroup(groupIndex);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploadingGroup === null) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      addImageToGroup(uploadingGroup, url);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setUploading(false);
      setUploadingGroup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      category: form.category,
      gender: form.gender,
      base_price: parseFloat(form.base_price) || 0,
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      is_active: form.is_active,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      meta_keywords: form.meta_keywords || null,
      variants: form.variants
        .filter((v) => v.size)
        .map((v) => ({ size: v.size, stock: parseInt(v.stock) || 0 })),
      image_groups: form.image_groups
        .filter((g) => g.label || g.urls.length > 0)
        .map((g) => ({ label: g.label, images: g.urls })),
    };

    const res = await fetch(
      editingId ? `/api/products/${editingId}` : '/api/products',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    setBusy(false);
    if (!res.ok) return;
    await loadProducts();
    closeForm();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts((c) => c.filter((p) => p.id !== id));
    setDeleteId(null);
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-black flex">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen overflow-hidden">

        {/* Brand */}
        <div className="px-5 py-6 border-b border-gray-100 shrink-0">
          <h1 className="text-xl font-serif tracking-widest font-normal">DANANA</h1>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#696969] mt-0.5">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#aaa] px-2 mb-3">Tables</p>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => { setActiveTable('products'); setView('list'); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                activeTable === 'products' ? 'bg-black text-white' : 'text-black hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="h-3.5 w-3.5 shrink-0" />
                Products
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${activeTable === 'products' ? 'bg-white/20' : 'bg-gray-100'}`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTable('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                activeTable === 'orders' ? 'bg-black text-white' : 'text-black hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                Orders
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${activeTable === 'orders' ? 'bg-white/20' : 'bg-gray-100'}`}>
                {orders.filter((o) => o.status === 'pending').length > 0
                  ? orders.filter((o) => o.status === 'pending').length
                  : orders.length}
              </span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-4 shrink-0">
          <p className="text-[11px] text-[#696969] truncate mb-3">{adminEmail}</p>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2 text-[13px] hover:border-black transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-screen">

        {activeTable === 'orders' ? (
          /* ── ORDERS LIST ─────────────────────────────────────────────── */
          <div className="flex flex-col min-h-full">

            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-medium">Orders</h2>
                <p className="text-[13px] text-[#696969] mt-0.5">
                  {ordersLoading
                    ? 'Loading…'
                    : `${orders.length} total · ${orders.filter((o) => o.status === 'pending').length} pending`}
                </p>
              </div>
              <button
                onClick={loadOrders}
                disabled={ordersLoading}
                className="flex items-center gap-2 border border-gray-200 px-3 py-2 text-[13px] hover:border-black transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Status filter tabs */}
            <div className="bg-white border-b border-gray-100 px-8 flex gap-1 shrink-0">
              {(['all', 'pending', 'contacted', 'completed'] as const).map((tab) => {
                const count = tab === 'all'
                  ? orders.length
                  : orders.filter((o) => o.status === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      const el = document.getElementById(`orders-${tab}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-3 text-[12px] uppercase tracking-wide text-[#696969] hover:text-black border-b-2 border-transparent hover:border-black transition-colors capitalize"
                  >
                    {tab === 'all' ? 'All' : tab} ({count})
                  </button>
                );
              })}
            </div>

            {/* Orders content */}
            <div className="flex-1 p-8">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-24 text-[13px] text-[#696969]">
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <ShoppingBag className="h-12 w-12 text-gray-200" />
                  <p className="text-[13px] text-[#696969]">No orders yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-w-3xl">
                  {orders.map((order) => {
                    const statusConfig = {
                      pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                      contacted: { label: 'Contacted', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                      completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
                    }[order.status];

                    const date = new Date(order.created_at);
                    const dateStr = date.toLocaleDateString('en-NP', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    });
                    const timeStr = date.toLocaleTimeString('en-NP', {
                      hour: '2-digit', minute: '2-digit',
                    });

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-gray-100 p-5 flex flex-col gap-4"
                      >
                        {/* Row 1: date + status badge */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[11px] text-[#aaa] uppercase tracking-wide">
                              {dateStr} · {timeStr}
                            </div>
                            <div className="text-[11px] text-[#aaa] mt-0.5">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-wide font-medium border shrink-0 ${statusConfig.cls}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Row 2: customer info */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-medium">{order.customer_name}</div>

                            <a
                              href={`tel:${order.phone}`}
                              className="inline-flex items-center gap-1.5 text-[13px] text-black hover:text-[#FA5D42] transition-colors mt-1"
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {order.phone}
                            </a>

                            {order.address && (
                              <div className="flex items-start gap-1.5 text-[13px] text-[#696969] mt-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{order.address}</span>
                              </div>
                            )}
                          </div>

                          {/* Total */}
                          <div className="text-right shrink-0">
                            <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-0.5">Total</div>
                            <div className="text-[16px] font-semibold">
                              Rs. {Number(order.subtotal).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Row 3: ordered items */}
                        {(order.items ?? []).length > 0 && (
                          <div className="border-t border-gray-50 pt-3 flex flex-col gap-1.5">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-3 text-[13px]">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.productTitle}
                                    className="w-8 h-8 object-cover bg-gray-100 shrink-0"
                                  />
                                )}
                                <span className="flex-1 truncate">{item.productTitle}</span>
                                <span className="text-[#696969] shrink-0">
                                  {[item.color, item.size].filter(Boolean).join(' · ')}
                                  {' '}&times; {item.quantity}
                                </span>
                                <span className="font-medium shrink-0">
                                  Rs. {(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Row 4: status actions */}
                        <div className="border-t border-gray-50 pt-3 flex flex-wrap gap-2">
                          {order.status !== 'contacted' && order.status !== 'completed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'contacted')}
                              className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 text-[12px] hover:bg-blue-100 transition-colors"
                            >
                              <Phone className="h-3 w-3" /> Mark contacted
                            </button>
                          )}
                          {order.status !== 'completed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="flex items-center gap-1.5 border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 text-[12px] hover:bg-green-100 transition-colors"
                            >
                              ✓ Mark completed
                            </button>
                          )}
                          {order.status !== 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'pending')}
                              className="border border-gray-200 text-[#696969] px-3 py-1.5 text-[12px] hover:border-black transition-colors"
                            >
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
        ) : view === 'list' ? (
          /* ── PRODUCT LIST ──────────────────────────────────────────────── */
          <div className="flex flex-col min-h-full">

            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-medium">Products</h2>
                <p className="text-[13px] text-[#696969] mt-0.5">
                  {loading ? 'Loading…' : `${products.length} item${products.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors"
              >
                <PlusCircle className="h-4 w-4" /> New product
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 p-8">
              {loading ? (
                <div className="flex items-center justify-center py-24 text-[13px] text-[#696969]">
                  Loading products…
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Package className="h-12 w-12 text-gray-200" />
                  <p className="text-[13px] text-[#696969]">No products yet</p>
                  <button
                    onClick={openAdd}
                    className="border border-black px-5 py-2 text-sm hover:bg-black hover:text-white transition-colors"
                  >
                    Add first product
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 overflow-hidden">

                  {/* Table head */}
                  <div className="hidden lg:grid grid-cols-[2.5rem_1fr_8rem_8rem_5rem_6rem_6.5rem] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div />
                    {['Product', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                      <div key={h} className={CLS_LABEL + ' !mb-0'}>{h}</div>
                    ))}
                  </div>

                  {products.map((product) => {
                    const img = getPrimaryImage(product);
                    const stock = getTotalStock(product);
                    return (
                      <div
                        key={product.id}
                        className="grid grid-cols-[2.5rem_1fr_auto] lg:grid-cols-[2.5rem_1fr_8rem_8rem_5rem_6rem_6.5rem] gap-4 px-5 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 bg-gray-100 shrink-0 overflow-hidden">
                          {img ? (
                            <img src={img} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Name + slug */}
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium leading-snug truncate">{product.name}</div>
                          <div className="text-[12px] text-[#696969] truncate mt-0.5">{product.slug}</div>
                        </div>

                        {/* Category */}
                        <div className="hidden lg:block text-[13px] text-[#696969] truncate">{product.category ?? '—'}</div>

                        {/* Price */}
                        <div className="hidden lg:block">
                          <div className="text-[14px] font-medium">Rs. {Number(product.base_price).toLocaleString()}</div>
                          {product.compare_price && (
                            <div className="text-[12px] text-[#696969] line-through">
                              Rs. {Number(product.compare_price).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Stock */}
                        <div className={`hidden lg:block text-[14px] font-medium ${stock === 0 ? 'text-[#FA5D42]' : ''}`}>
                          {stock}
                        </div>

                        {/* Status */}
                        <div className="hidden lg:block">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium border ${
                              product.is_active
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-50 text-[#696969] border-gray-200'
                            }`}
                          >
                            {product.is_active ? 'Active' : 'Draft'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => openEdit(product)}
                            className="flex items-center gap-1.5 border border-gray-200 px-2.5 py-1.5 text-[12px] hover:border-black transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="border border-gray-200 p-1.5 text-[#FA5D42] hover:border-[#FA5D42] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── PRODUCT FORM ──────────────────────────────────────────────── */
          <div className="max-w-3xl mx-auto px-6 lg:px-10 py-8">

            {/* Back */}
            <button
              onClick={closeForm}
              className="flex items-center gap-2 text-[13px] text-[#696969] hover:text-black mb-7 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Products
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-medium">
                {editingId ? 'Edit product' : 'New product'}
              </h2>
              <p className="text-[13px] text-[#696969] mt-1">
                {editingId
                  ? 'Update the details below and save'
                  : 'Fill in the details to add a product to your catalog'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-10">

              {/* ── BASIC INFO ── */}
              <Section title="Basic information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="sm:col-span-2">
                    <label className={CLS_LABEL}>Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Home Kit Jersey 2026"
                      required
                      className={CLS_INPUT}
                    />
                  </div>

                  <div>
                    <label className={CLS_LABEL}>
                      Slug&ensp;<span className="text-[#aaa] normal-case tracking-normal font-normal">· auto-filled, editable</span>
                    </label>
                    <input
                      value={form.slug}
                      onChange={(e) => setField('slug', e.target.value)}
                      placeholder="home-kit-jersey-2026"
                      required
                      className={CLS_INPUT}
                    />
                  </div>

                  <div>
                    <label className={CLS_LABEL}>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setField('category', e.target.value)}
                      className={CLS_SELECT}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={CLS_LABEL}>Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setField('gender', e.target.value as FormState['gender'])}
                      className={CLS_SELECT}
                    >
                      <option value="male">Men</option>
                      <option value="female">Women</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.is_active}
                      onClick={() => setField('is_active', !form.is_active)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none ${
                        form.is_active ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                          form.is_active ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-[13px]">
                      {form.is_active ? 'Active — visible in store' : 'Draft — hidden from store'}
                    </span>
                  </div>
                </div>
              </Section>

              {/* ── DESCRIPTION ── */}
              <Section title="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={4}
                  placeholder="Describe the product — material, fit, features…"
                  className={CLS_INPUT + ' resize-none'}
                />
              </Section>

              {/* ── PRICING ── */}
              <Section title="Pricing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className={CLS_LABEL}>Base price</label>
                    <div className="relative">
                      <span className="absolute left-0 top-2.5 text-sm text-[#aaa]">$</span>
                      <input
                        value={form.base_price}
                        onChange={(e) => setField('base_price', e.target.value)}
                        type="number" step="0.01" min="0" placeholder="0.00" required
                        className={CLS_INPUT + ' pl-4'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={CLS_LABEL}>
                      Compare-at price&ensp;<span className="text-[#aaa] normal-case tracking-normal font-normal">· shown crossed out</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-0 top-2.5 text-sm text-[#aaa]">$</span>
                      <input
                        value={form.compare_price}
                        onChange={(e) => setField('compare_price', e.target.value)}
                        type="number" step="0.01" min="0" placeholder="0.00"
                        className={CLS_INPUT + ' pl-4'}
                      />
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── SIZES & STOCK ── */}
              <Section title="Sizes &amp; stock">
                <div className="flex flex-col gap-3">
                  {/* Column headers */}
                  <div className="grid grid-cols-[9rem_1fr_2rem] gap-4 items-center">
                    <span className={CLS_LABEL + ' !mb-0'}>Size</span>
                    <span className={CLS_LABEL + ' !mb-0'}>Stock</span>
                    <span />
                  </div>

                  {form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-[9rem_1fr_2rem] gap-4 items-center">
                      <select
                        value={v.size}
                        onChange={(e) => updateVariant(i, 'size', e.target.value)}
                        className="border-b border-gray-200 py-2 text-sm outline-none focus:border-black bg-transparent appearance-none cursor-pointer"
                      >
                        {SIZES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <input
                        value={v.stock}
                        onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                        type="number" min="0"
                        className="border-b border-gray-200 py-2 text-sm text-center outline-none focus:border-black bg-transparent"
                      />
                      {form.variants.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="text-[#696969] hover:text-black transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-4 flex items-center gap-1.5 text-[13px] text-[#696969] hover:text-black transition-colors"
                >
                  <PlusCircle className="h-4 w-4" /> Add size
                </button>
              </Section>

              {/* ── IMAGES ── */}
              <Section title="Image groups">
                {/* Hidden file input — shared across all groups */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <ImageGroupEditor
                  groups={form.image_groups}
                  uploading={uploading}
                  uploadingGroup={uploadingGroup}
                  onLabelChange={updateGroupLabel}
                  onAddImage={addImageToGroup}
                  onRemoveImage={removeImageFromGroup}
                  onAddGroup={addGroup}
                  onRemoveGroup={removeGroup}
                  onTriggerUpload={triggerUpload}
                />
              </Section>

              {/* ── SEO ── */}
              <Section title="SEO">
                <div className="flex flex-col gap-6">
                  <div>
                    <label className={CLS_LABEL}>
                      Meta title&ensp;<span className="text-[#aaa] normal-case tracking-normal font-normal">· title tag in search results</span>
                    </label>
                    <input
                      value={form.meta_title}
                      onChange={(e) => setField('meta_title', e.target.value)}
                      placeholder={form.name ? `${form.name} | DANANA` : 'Product name | DANANA'}
                      maxLength={70}
                      className={CLS_INPUT}
                    />
                    <p className="mt-1 text-[11px] text-[#aaa]">
                      {form.meta_title.length}/70 characters
                    </p>
                  </div>

                  <div>
                    <label className={CLS_LABEL}>
                      Meta description&ensp;<span className="text-[#aaa] normal-case tracking-normal font-normal">· shown in search snippets</span>
                    </label>
                    <textarea
                      value={form.meta_description}
                      onChange={(e) => setField('meta_description', e.target.value)}
                      rows={2}
                      maxLength={160}
                      placeholder="A brief description shown under your page title in search results…"
                      className={CLS_INPUT + ' resize-none'}
                    />
                    <p className="mt-1 text-[11px] text-[#aaa]">
                      {form.meta_description.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label className={CLS_LABEL}>
                      Keywords&ensp;<span className="text-[#aaa] normal-case tracking-normal font-normal">· comma-separated</span>
                    </label>
                    <input
                      value={form.meta_keywords}
                      onChange={(e) => setField('meta_keywords', e.target.value)}
                      placeholder="jersey, football, worldcup, home kit, 2026"
                      className={CLS_INPUT}
                    />
                  </div>
                </div>
              </Section>

              {/* ── SUBMIT ── */}
              <div className="flex items-center gap-3 py-6 border-t border-gray-100">
                <button
                  disabled={busy}
                  className="bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-black/80 transition-colors disabled:opacity-50"
                >
                  {busy ? 'Saving…' : editingId ? 'Update product' : 'Create product'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="border border-gray-200 px-8 py-3 text-[13px] hover:border-black transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}
      </div>

      {/* ── DELETE MODAL ─────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-[17px] font-medium mb-2">Delete product?</h3>
            <p className="text-[13px] text-[#696969] mb-6">
              This action cannot be undone. The product will be permanently removed from the database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-black text-white py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 py-2.5 text-[13px] hover:border-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#696969] pb-4 mb-5 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </section>
  );
}
