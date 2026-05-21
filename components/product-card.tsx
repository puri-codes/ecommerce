import Link from 'next/link';
import type { DbProduct } from '@/lib/types';

export function ProductCard({ product }: { product: DbProduct }) {
  const primaryImage = product.image_groups?.[0]?.images?.[0];
  const basePrice = Number(product.base_price);
  const comparePrice = product.compare_price ? Number(product.compare_price) : null;

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden w-full">
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
      </div>
      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-[15px] text-black">{product.name}</h3>
        {product.category && (
          <p className="text-[12px] text-[#696969]">{product.category}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {comparePrice && comparePrice > basePrice && (
            <span className="text-[#696969] line-through text-[14px]">
              Rs. {comparePrice.toLocaleString()}
            </span>
          )}
          <span className="text-[#FA5D42] text-[15px] font-medium">
            Rs. {basePrice.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
