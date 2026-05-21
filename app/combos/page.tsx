import { getCombos, getProducts } from '@/lib/db';
import { CombosClient } from '@/components/combos-client';

export const revalidate = 60;

export default async function CombosPage() {
  const [combos, products] = await Promise.all([getCombos(), getProducts()]);

  return (
    <div className="flex flex-col pb-20">
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#696969] mb-1">Better together</p>
          <h1 className="text-[32px] font-semibold text-black">Combo Deals</h1>
          <p className="text-[#696969] text-sm mt-2">
            Bundle your favourites and save more. Select sizes for each item, then add the whole bundle to your cart.
          </p>
        </div>

        {combos.length === 0 ? (
          <div className="py-24 text-center text-sm text-[#696969]">No combo deals available yet. Check back soon.</div>
        ) : (
          <CombosClient combos={combos} products={products} />
        )}
      </section>
    </div>
  );
}
