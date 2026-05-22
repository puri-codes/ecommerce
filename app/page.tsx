import Link from 'next/link';
import { getFeaturedProducts, getProducts, getCombos } from '@/lib/db';
import { ProductCard } from '@/components/product-card';
import type { ComboItem } from '@/lib/types';

export const revalidate = 60;

const heroImage = '/hero_banner.png';

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
        <div className="absolute bottom-10 left-0 right-0">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
            <p className="text-white/70 text-xs uppercase tracking-[0.3em] mb-2">New Season</p>
            <h2 className="text-white text-4xl sm:text-5xl font-serif tracking-widest">DANANA</h2>
          </div>
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
        <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-12">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#696969] mb-1">Better together</p>
              <h2 className="text-[28px] font-semibold text-black">Combo Deals</h2>
            </div>
            <Link href="/combos" className="text-[#696969] hover:text-black text-sm hidden sm:block transition-colors">
              See all deals
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
            {combos.slice(0, 6).map(combo => {
              const savings = Number(combo.original_price) - Number(combo.combo_price);
              const pct     = Number(combo.original_price) > 0
                ? Math.round((savings / Number(combo.original_price)) * 100)
                : 0;
              const bgImage = combo.image_url || combo.items?.[0]?.image || null;

              return (
                <Link key={combo.id} href="/combos" className="group flex flex-col gap-0">

                  {/* Image */}
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                    {bgImage ? (
                      <img
                        src={bgImage}
                        alt={combo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-300 text-sm">No image</span>
                      </div>
                    )}
                    {pct > 0 && (
                      <span className="absolute top-2.5 left-2.5 bg-[#FA5D42] text-white text-[10px] font-bold px-2 py-0.5">
                        -{pct}%
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-3 flex flex-col gap-2 px-1">
                    <h3 className="text-[14px] text-black group-hover:opacity-70 transition-opacity leading-snug">
                      {combo.name}
                    </h3>

                    <p className="text-[11px] text-[#696969] truncate">
                      {(combo.items ?? []).map((i: ComboItem) => i.product_name).join(' + ')}
                    </p>

                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {savings > 0 && (
                        <span className="text-[#696969] line-through text-[13px]">
                          Rs. {Number(combo.original_price).toLocaleString()}
                        </span>
                      )}
                      <span className="text-[#FA5D42] text-[14px] font-medium">
                        Rs. {Number(combo.combo_price).toLocaleString()}
                      </span>
                      {savings > 0 && (
                        <span className="text-[11px] text-[#027D48] font-medium">
                          · save Rs. {savings.toLocaleString()}
                        </span>
                      )}
                    </div>
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
