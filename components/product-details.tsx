'use client';
import { useState } from 'react';
import { Product } from '@/lib/data';
import { useCartStore } from '@/lib/store';
import { Minus, Plus } from 'lucide-react';
import Link from 'next/link';

export function ProductDetails({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productTitle: product.title,
      price: product.price,
      image: product.images[0],
      color: selectedColor,
      size: selectedSize,
      quantity
    });
  };

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6 text-sm text-[#696969]">
        <Link href="/">Home</Link> / <Link href="/">All products</Link> / <span className="text-black">Product details</span>
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 mb-16 flex flex-col md:flex-row gap-10">
        
        {/* Images Left Section */}
        <div className="md:w-[60%] flex gap-4">
          <div className="w-20 hidden sm:flex flex-col gap-4">
            {product.images.map((img, i) => (
              <button 
                key={i} 
                className={`w-full aspect-[4/5] overflow-hidden border ${activeImage === i ? 'border-black' : 'border-transparent'}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="flex-1 bg-gray-100 relative aspect-[4/5] sm:aspect-[4/5] overflow-hidden">
            <img src={product.images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Details Right Section */}
        <div className="md:w-[40%] flex flex-col pt-8">
          <p className="text-[#696969] text-sm mb-2">{product.category}</p>
          <h1 className="text-[32px] font-semibold text-black leading-tight mb-4">{product.title}</h1>
          
          <div className="text-[24px] font-semibold text-[#FA5D42] mb-1">${product.price}</div>
          {!product.inStock && (
            <div className="text-[#D7373C] font-medium mb-8">Out of stock</div>
          )}
          {product.inStock && <div className="mb-8" />}

          {/* Color */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-black mb-2 uppercase">COLOR</p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map(color => (
                  <button 
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded-sm text-sm ${selectedColor === color ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-8">
              <p className="text-sm text-black mb-2 uppercase">SIZE</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-sm text-sm ${selectedSize === size ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-black/20 rounded-sm h-12 w-32">
              <button 
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input 
                type="number" 
                className="flex-1 text-center font-semibold text-black bg-transparent outline-none m-0 p-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={quantity}
                readOnly
              />
              <button 
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button 
              className="flex-1 bg-black text-white h-12 font-medium rounded-sm disabled:opacity-50"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              Add to Cart
            </button>
          </div>

          {/* Delivery & Description */}
          <div className="flex flex-col gap-4 text-[#027D48] text-sm font-medium border-t border-gray-200 pt-8 mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 256 256"><path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z"/></svg>
              <span>Estimated Delivery: Within 3 days</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"/></svg>
              <span>Delivery date: January 7-11</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-[20px] font-medium text-black mb-3">Description</h3>
            <p className="text-black text-[14px] leading-relaxed w-full">
              {product.description}
            </p>
          </div>

          <div>
            <h3 className="text-[20px] font-medium text-black mb-3">Returns</h3>
            <p className="text-[#027D48] text-[14px] leading-relaxed">
              Free standard shipping on orders $50+ and free 60-day returns for Danana Members.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
