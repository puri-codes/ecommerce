'use client';
import { useState } from 'react';
import type { DbCombo, DbProduct } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { ShoppingCart } from 'lucide-react';

type Props = { combos: DbCombo[]; products: DbProduct[] };

export function CombosClient({ combos, products }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {combos.map(combo => (
        <ComboCard key={combo.id} combo={combo} products={products} />
      ))}
    </div>
  );
}

function ComboCard({ combo, products }: { combo: DbCombo; products: DbProduct[] }) {
  const { addItem } = useCartStore();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  const totalBase = (combo.items ?? []).reduce((s, i) => s + Number(i.base_price), 0);

  function itemPrice(basePx: number) {
    if (!totalBase) return 0;
    return Math.round((basePx / totalBase) * Number(combo.combo_price));
  }

  const allSelected = (combo.items ?? []).every(item => selectedSizes[item.product_id]);

  function handleAddToCart() {
    if (!allSelected) return;
    combo.items.forEach(item => {
      addItem({
        productId: item.product_id,
        productTitle: `${item.product_name} (${combo.name})`,
        price: itemPrice(item.base_price),
        image: item.image ?? '',
        size: selectedSizes[item.product_id],
        color: undefined,
        quantity: 1,
      });
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const savings = Number(combo.original_price) - Number(combo.combo_price);
  const pct = totalBase > 0 ? Math.round((savings / Number(combo.original_price)) * 100) : 0;

  return (
    <div className="border border-gray-100 bg-white overflow-hidden">
      <div className="flex flex-col md:flex-row">

        {/* Left: product images */}
        <div className="md:w-[220px] shrink-0 flex gap-2 p-5 bg-gray-50">
          {(combo.items ?? []).slice(0, 3).map(item => (
            <div key={item.product_id} className="flex-1 aspect-[4/5] bg-gray-100 overflow-hidden">
              {item.image && <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>

        {/* Right: details */}
        <div className="flex-1 p-6 flex flex-col gap-5">

          {/* Title + badge */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-[20px] font-semibold">{combo.name}</h2>
              {combo.description && (
                <p className="text-[13px] text-[#696969] mt-1">{combo.description}</p>
              )}
            </div>
            {pct > 0 && (
              <span className="shrink-0 bg-[#EDE735] text-black text-xs font-bold px-2.5 py-1">-{pct}%</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {savings > 0 && (
              <span className="text-[#696969] line-through text-base">
                Rs. {Number(combo.original_price).toLocaleString()}
              </span>
            )}
            <span className="text-[22px] font-semibold text-[#FA5D42]">
              Rs. {Number(combo.combo_price).toLocaleString()}
            </span>
            {savings > 0 && (
              <span className="text-[13px] text-[#027D48] font-medium">
                Save Rs. {savings.toLocaleString()}
              </span>
            )}
          </div>

          {/* Size selectors per product */}
          <div className="flex flex-col gap-4">
            {combo.items.map(item => {
              const product = products.find(p => p.id === item.product_id);
              const variants = product?.variants ?? [];
              return (
                <div key={item.product_id}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] uppercase tracking-[0.2em] text-[#696969]">{item.product_name}</p>
                    <p className="text-[12px] text-[#696969]">Rs. {itemPrice(item.base_price).toLocaleString()}</p>
                  </div>
                  {variants.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {variants.map(v => (
                        <button
                          key={v.size}
                          onClick={() => setSelectedSizes(s => ({ ...s, [item.product_id]: v.size }))}
                          disabled={v.stock === 0}
                          className={`w-11 h-11 text-sm border transition-colors ${
                            v.stock === 0
                              ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                              : selectedSizes[item.product_id] === v.size
                                ? 'bg-black text-white border-black'
                                : 'border-gray-300 hover:border-black'
                          }`}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#aaa]">No size variants</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!allSelected}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              added
                ? 'bg-[#027D48] text-white'
                : allSelected
                  ? 'bg-black text-white hover:bg-black/80'
                  : 'bg-gray-100 text-[#aaa] cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {added ? 'Added to cart!' : allSelected ? 'Add bundle to cart' : 'Select sizes to continue'}
          </button>

          {!allSelected && (
            <p className="text-[11px] text-[#696969] -mt-3">
              Please select a size for each item in the bundle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
