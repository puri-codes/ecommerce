'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import type { DbProduct } from '@/lib/types';
import { useCartStore } from '@/lib/store';

export function ProductCard({ product }: { product: DbProduct }) {
  const { addItem } = useCartStore();

  const primaryImage = product.image_groups?.[0]?.images?.[0];
  const basePrice    = Number(product.base_price);
  const comparePrice = product.compare_price ? Number(product.compare_price) : null;
  const variants     = product.variants ?? [];

  const [selectedSize, setSelectedSize] = useState(
    // Auto-select the first in-stock size if only one available
    variants.length === 1 && variants[0].stock > 0 ? variants[0].size : ''
  );
  const [quantity, setQuantity] = useState(1);
  const [added,    setAdded]    = useState(false);

  const selectedVariant = variants.find((v) => v.size === selectedSize);
  const inStock         = selectedVariant ? selectedVariant.stock > 0 : variants.some((v) => v.stock > 0);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (variants.length > 0 && !selectedSize) return;
    if (selectedVariant && selectedVariant.stock === 0) return;

    addItem({
      productId: product.id,
      productTitle: product.name,
      price: basePrice,
      image: primaryImage ?? '',
      size: selectedSize || undefined,
      color: product.image_groups?.[0]?.label || undefined,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const needsSizeSelection = variants.length > 0 && !selectedSize;
  const canAdd = inStock && !needsSizeSelection;

  return (
    <div className="flex flex-col gap-0">

      {/* Image — links to product page */}
      <Link href={`/product/${product.slug}`} className="group relative block aspect-[4/5] bg-gray-100 overflow-hidden w-full">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-sm">No image</span>
          </div>
        )}
        {comparePrice && comparePrice > basePrice && (
          <span className="absolute top-2.5 left-2.5 bg-[#FA5D42] text-white text-[10px] font-bold px-2 py-0.5">
            SALE
          </span>
        )}
      </Link>

      {/* Info + quick-add */}
      <div className="flex flex-col gap-2.5 px-1 pt-3">

        {/* Name + price */}
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-[14px] text-black hover:opacity-70 transition-opacity leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>
          {product.category && (
            <p className="text-[11px] text-[#696969] mt-0.5">{product.category}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {comparePrice && comparePrice > basePrice && (
              <span className="text-[#696969] line-through text-[13px]">
                Rs. {comparePrice.toLocaleString()}
              </span>
            )}
            <span className="text-[#FA5D42] text-[14px] font-medium">
              Rs. {basePrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Size selector */}
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {variants.map((v) => (
              <button
                key={v.size}
                onClick={() => setSelectedSize(v.size === selectedSize ? '' : v.size)}
                disabled={v.stock === 0}
                className={`min-w-[2rem] px-2 py-1 text-[11px] border transition-colors ${
                  v.stock === 0
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                    : selectedSize === v.size
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 hover:border-black text-black'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}

        {/* Quantity + Add to cart row */}
        <div className="flex gap-1.5">
          {/* Qty stepper */}
          <div className="flex items-center border border-gray-200 h-9 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setQuantity((q) => Math.max(1, q - 1)); }}
              className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-[13px] font-medium select-none">{quantity}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setQuantity((q) => q + 1); }}
              className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!canAdd && !added}
            className={`flex-1 h-9 flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${
              added
                ? 'bg-[#027D48] text-white'
                : canAdd
                  ? 'bg-black text-white hover:bg-black/80'
                  : needsSizeSelection
                    ? 'bg-gray-50 text-[#696969] border border-gray-200'
                    : 'bg-gray-100 text-[#aaa] cursor-not-allowed'
            }`}
          >
            {added ? (
              '✓ Added'
            ) : needsSizeSelection ? (
              'Pick size'
            ) : !inStock ? (
              'Out of stock'
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
