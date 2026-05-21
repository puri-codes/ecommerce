'use client';
import { useEffect, useState } from 'react';
import type { DbCombo, DbProduct } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { ShoppingCart } from 'lucide-react';

type Props = { combos: DbCombo[]; products: DbProduct[] };

export function CombosClient({ combos, products }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {combos.map((combo) => (
        <ComboCard key={combo.id} combo={combo} products={products} />
      ))}
    </div>
  );
}

// ── Auto-sliding image carousel ──────────────────────────────────────────────

function ComboCarousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length]);

  if (images.length === 0) {
    return <div className="w-full aspect-[4/5] bg-gray-100" />;
  }

  return (
    <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === idx ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual combo card ────────────────────────────────────────────────────

function ComboCard({ combo, products }: { combo: DbCombo; products: DbProduct[] }) {
  const { addItem } = useCartStore();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  // Carousel images: custom image_url first, then one image per product in the combo
  const carouselImages: string[] = [];
  if (combo.image_url) carouselImages.push(combo.image_url);
  combo.items.forEach((item) => { if (item.image) carouselImages.push(item.image); });

  const savings  = Number(combo.original_price) - Number(combo.combo_price);
  const pct      = Number(combo.original_price) > 0
    ? Math.round((savings / Number(combo.original_price)) * 100)
    : 0;

  const allSelected = combo.items.every((item) => selectedSizes[item.product_id]);

  function handleAddBundle() {
    if (!allSelected) return;

    // Encode all sizes into the `size` field so the cart can deduplicate correctly
    const sizeKey = combo.items.map((i) => selectedSizes[i.product_id]).join(',');

    addItem({
      productId: combo.id,
      productTitle: combo.name,
      price: Number(combo.combo_price),
      image: carouselImages[0] ?? '',
      size: sizeKey,
      isCombo: true,
      comboItems: combo.items.map((item) => ({
        productName: item.product_name,
        size: selectedSizes[item.product_id],
      })),
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="border border-gray-100 bg-white overflow-hidden">
      <div className="flex flex-col md:flex-row">

        {/* ── Left: carousel ── */}
        <div className="md:w-[280px] shrink-0">
          <ComboCarousel images={carouselImages} title={combo.name} />
        </div>

        {/* ── Right: details ── */}
        <div className="flex-1 p-6 flex flex-col gap-5">

          {/* Title + savings badge */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-[20px] font-semibold leading-tight">{combo.name}</h2>
              {combo.description && (
                <p className="text-[13px] text-[#696969] mt-1.5 leading-relaxed">{combo.description}</p>
              )}
            </div>
            {pct > 0 && (
              <span className="shrink-0 bg-[#EDE735] text-black text-xs font-bold px-2.5 py-1">
                -{pct}%
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {savings > 0 && (
              <span className="text-[#696969] line-through text-base">
                Rs. {Number(combo.original_price).toLocaleString()}
              </span>
            )}
            <span className="text-[24px] font-semibold text-[#FA5D42]">
              Rs. {Number(combo.combo_price).toLocaleString()}
            </span>
            {savings > 0 && (
              <span className="text-[13px] text-[#027D48] font-medium">
                Save Rs. {savings.toLocaleString()}
              </span>
            )}
          </div>

          {/* Includes label */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-3">Includes</p>
            <div className="flex flex-col gap-4">
              {combo.items.map((item) => {
                const product  = products.find((p) => p.id === item.product_id);
                const variants = product?.variants ?? [];

                return (
                  <div key={item.product_id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-medium">{item.product_name}</p>
                      <p className="text-[12px] text-[#696969]">
                        Rs. {item.base_price.toLocaleString()}
                      </p>
                    </div>

                    {variants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map((v) => (
                          <button
                            key={v.size}
                            onClick={() =>
                              setSelectedSizes((s) => ({ ...s, [item.product_id]: v.size }))
                            }
                            disabled={v.stock === 0}
                            className={`w-10 h-10 text-[12px] border transition-colors ${
                              v.stock === 0
                                ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                                : selectedSizes[item.product_id] === v.size
                                  ? 'bg-black text-white border-black'
                                  : 'border-gray-300 hover:border-black'
                            }`}
                            title={v.stock === 0 ? 'Out of stock' : `${v.stock} available`}
                          >
                            {v.size}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#aaa]">One size</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add bundle to cart */}
          <div className="mt-auto pt-2">
            <button
              onClick={handleAddBundle}
              disabled={!allSelected}
              className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium tracking-wide transition-colors ${
                added
                  ? 'bg-[#027D48] text-white'
                  : allSelected
                    ? 'bg-black text-white hover:bg-black/80'
                    : 'bg-gray-100 text-[#aaa] cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              {added
                ? 'Bundle added to cart!'
                : allSelected
                  ? 'Add bundle to cart'
                  : 'Select a size for each item'}
            </button>

            <p className="text-[11px] text-[#696969] text-center mt-2">
              This bundle is added as one item — remove it together or keep it together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
