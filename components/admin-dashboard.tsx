'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, PlusCircle, Pencil, Trash2 } from 'lucide-react';

type Variant    = { size: string; stock: number };
type ImageGroup = { label: string; images: string[] };

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  base_price: string | number;
  compare_price: string | number | null;
  is_active: boolean;
  variants: Variant[];
  image_groups: ImageGroup[];
};

const CLS_LABEL = 'block text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-2';

function getTotalStock(p: Product) {
  return (p.variants ?? []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

function getPrimaryImage(p: Product) {
  return p.image_groups?.[0]?.images?.[0] ?? null;
}

export function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts((c) => c.filter((p) => p.id !== id));
    setDeleteId(null);
  }

  return (
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
          onClick={() => router.push('/admin/products/new')}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors"
        >
          <PlusCircle className="h-4 w-4" /> New product
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[13px] text-[#696969]">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Package className="h-12 w-12 text-gray-200" />
            <p className="text-[13px] text-[#696969]">No products yet</p>
            <button
              onClick={() => router.push('/admin/products/new')}
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
              const img   = getPrimaryImage(product);
              const stock = getTotalStock(product);
              return (
                <div key={product.id}
                  className="grid grid-cols-[2.5rem_1fr_auto] lg:grid-cols-[2.5rem_1fr_8rem_8rem_5rem_6rem_6.5rem] gap-4 px-5 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50 transition-colors">

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
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium border ${
                      product.is_active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-[#696969] border-gray-200'
                    }`}>
                      {product.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
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

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-[17px] font-medium mb-2">Delete product?</h3>
            <p className="text-[13px] text-[#696969] mb-6">
              This action cannot be undone. The product will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-black text-white py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors">
                Delete
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 py-2.5 text-[13px] hover:border-black transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
