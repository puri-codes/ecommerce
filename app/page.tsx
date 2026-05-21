import Link from 'next/link';
import { getFeaturedProducts, getProducts, getCombos } from '@/lib/db';
import { ProductCard } from '@/components/product-card';
import type { ComboItem } from '@/lib/types';

export const revalidate = 60;

const heroImage =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2400';

export default async function HomePage() {
  const [featured, all, combos] = await Promise.all([
    getFeaturedProducts(),
    getProducts(),
    getCombos(),
  ]);

  const regular = all.filter(p => !p.is_featured);

  return (
    <div className="flex flex-col pb-16">

      {/* ── Hero ── */}
      <section className="h-[calc(100vh-5rem)] relative overflow-hidden bg-gray-100">
        <img src={heroImage} alt="DANANA — New Season Collection"
          className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute bottom-10 left-6 sm:left-10">
          <p className="text-white/70 text-xs uppercase tracking-[0.3em] mb-2">New Season</p>
          <h2 className="text-white text-4xl sm:text-5xl font-serif tracking-widest">DANANA</h2>
        </div>
      </section>

      {/* ── Featured products ── */}
      {featured.length > 0 && (
        <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#696969] mb-1">Hand-picked</p>
              <h2 className="text-[28px] font-semibold text-black">Featured</h2>
            </div>
            <Link href="/all-products" className="text-[#696969] hover:text-black text-sm hidden sm:block">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-10">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Combo deals ── */}
      {combos.length > 0 && (
        <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#696969] mb-1">Better together</p>
              <h2 className="text-[28px] font-semibold text-black">Combo Deals</h2>
            </div>
            <Link href="/combos" className="text-[#696969] hover:text-black text-sm hidden sm:block">
              See all deals
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.slice(0, 3).map(combo => {
              const savings = Number(combo.original_price) - Number(combo.combo_price);
              const pct = combo.original_price
                ? Math.round((savings / Number(combo.original_price)) * 100)
                : 0;
              return (
                <Link key={combo.id} href="/combos" className="group block border border-gray-100 bg-white p-6 hover:border-black transition-colors">
                  {/* Product image strip */}
                  {(combo.items ?? []).length > 0 && (
                    <div className="flex gap-2 mb-5">
                      {combo.items.slice(0, 3).map((item: ComboItem) => (
                        <div key={item.product_id} className="w-16 h-20 bg-gray-100 overflow-hidden">
                          {item.image && <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-medium">{combo.name}</h3>
                      <p className="text-[12px] text-[#696969] mt-1">
                        {(combo.items ?? []).map((i: ComboItem) => i.product_name).join(' + ')}
                      </p>
                    </div>
                    {pct > 0 && (
                      <span className="shrink-0 bg-[#EDE735] text-black text-[11px] font-bold px-2 py-0.5">
                        -{pct}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 mt-3">
                    {savings > 0 && (
                      <span className="text-[#696969] line-through text-sm">Rs. {Number(combo.original_price).toLocaleString()}</span>
                    )}
                    <span className="text-[#FA5D42] text-lg font-semibold">Rs. {Number(combo.combo_price).toLocaleString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── All products ── */}
      {regular.length > 0 && (
        <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-10">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-[28px] font-semibold text-black">Products</h2>
            <Link href="/all-products" className="text-[#696969] hover:text-black text-sm hidden sm:block">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-10">
            {regular.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {regular.length > 8 && (
            <div className="mt-12 flex justify-center">
              <Link href="/all-products"
                className="border border-black px-6 py-2.5 text-sm font-medium hover:-translate-y-0.5 transition-transform">
                See all products
              </Link>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
