"use client";
import { useEffect, useState } from 'react';
import { ProductCard } from './product-card';
import type { DbProduct } from '@/lib/types';

export function ProductListClient() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-[#696969]">Loading products…</div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-24 text-center text-sm text-[#696969]">No products available yet.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
