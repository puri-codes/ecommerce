"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Pencil, AlertTriangle } from "lucide-react";
import type { DbProduct } from "@/lib/types";
import { useCartStore } from "@/lib/store";

const CUSTOMIZATION_FEE = 500;

export function ProductDetails({ product }: { product: DbProduct }) {
  const groups = product.image_groups ?? [];
  const variants = product.variants ?? [];

  const [activeGroup, setActiveGroup] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(variants[0]?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [customizeEnabled, setCustomizeEnabled] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const { addItem } = useCartStore();

  const currentGroup = groups[activeGroup] ?? { label: "", images: [] };
  const currentImages = currentGroup.images ?? [];

  const selectedVariant = useMemo(
    () => variants.find((v) => v.size === selectedSize),
    [variants, selectedSize],
  );

  const stockCount = selectedVariant?.stock ?? 0;
  const inStock = stockCount > 0;
  const basePrice = Number(product.base_price);
  const comparePrice = product.compare_price
    ? Number(product.compare_price)
    : null;
  const effectivePrice = customizeEnabled ? basePrice + CUSTOMIZATION_FEE : basePrice;

  function switchGroup(i: number) {
    setActiveGroup(i);
    setActiveImage(0);
  }

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productTitle: product.name,
      price: effectivePrice,
      image: currentImages[0] ?? "",
      color: currentGroup.label || undefined,
      size: selectedSize || undefined,
      quantity,
      customization:
        customizeEnabled && (playerName.trim() || playerNumber.trim())
          ? { playerName: playerName.trim().toUpperCase(), playerNumber: playerNumber.trim() }
          : undefined,
    });
  }

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-5 text-sm text-[#696969]">
        <Link href="/" className="hover:text-black transition-colors">
          Home
        </Link>
        {" / "}
        <Link
          href="/all-products"
          className="hover:text-black transition-colors"
        >
          All products
        </Link>
        {" / "}
        <span className="text-black">{product.name}</span>
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 mb-16 flex flex-col md:flex-row gap-10 lg:gap-16">
        {/* ── LEFT: Image gallery ── */}
        <div className="md:w-[55%] flex flex-col gap-4">
          {/* Image group tabs — e.g. Home Kit / Away Kit */}
          {groups.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {groups.map((group, i) => (
                <button
                  key={i}
                  onClick={() => switchGroup(i)}
                  className={`px-4 py-1.5 text-[13px] border transition-colors ${
                    activeGroup === i
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-black"
                  }`}
                >
                  {group.label || `Option ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Gallery row */}
          <div className="flex gap-3">
            {/* Thumbnail strip */}
            {currentImages.length > 0 && (
              <div className="hidden sm:flex flex-col gap-2 w-[72px] shrink-0">
                {currentImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-full aspect-[4/5] overflow-hidden border-[1.5px] transition-colors ${
                      activeImage === i
                        ? "border-black"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 aspect-[4/5] bg-gray-100 overflow-hidden">
              {currentImages.length > 0 ? (
                <img
                  src={currentImages[activeImage] ?? currentImages[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Mobile thumbnail strip */}
          {currentImages.length > 1 && (
            <div className="sm:hidden flex gap-2 overflow-x-auto">
              {currentImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-16 overflow-hidden border-[1.5px] transition-colors ${
                    activeImage === i ? "border-black" : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product info ── */}
        <div className="md:w-[45%] flex flex-col pt-2 md:pt-4">
          {/* Category + name */}
          {product.category && (
            <p className="text-[#696969] text-sm mb-2 uppercase tracking-wide">
              {product.category}
            </p>
          )}
          <h1 className="text-[30px] sm:text-[34px] font-semibold text-black leading-tight mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            {comparePrice && comparePrice > basePrice && (
              <span className="text-[#696969] line-through text-lg">
                Rs. {comparePrice.toLocaleString()}
              </span>
            )}
            <span className="text-[26px] font-semibold text-[#FA5D42]">
              Rs. {effectivePrice.toLocaleString()}
            </span>
            {customizeEnabled && (
              <span className="text-[12px] text-[#696969] font-medium">
                incl. Rs. {CUSTOMIZATION_FEE} customization
              </span>
            )}
            {!customizeEnabled && comparePrice && comparePrice > basePrice && (
              <span className="text-sm text-[#027D48] font-medium">
                Save Rs. {(comparePrice - basePrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock badge */}
          {selectedSize && (
            <div className="mb-6">
              {stockCount === 0 ? (
                <span className="inline-block text-[13px] text-[#D7373C] font-medium">
                  Out of stock
                </span>
              ) : stockCount <= 5 ? (
                <span className="inline-block text-[13px] text-orange-500 font-medium">
                  Only {stockCount} left
                </span>
              ) : (
                <span className="inline-block text-[13px] text-[#027D48] font-medium">
                  In stock
                </span>
              )}
            </div>
          )}

          {/* Kit selector label */}
          {groups.length > 0 && currentGroup.label && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#696969] mb-1">
                Selected kit
              </p>
              <p className="text-sm font-medium">{currentGroup.label}</p>
            </div>
          )}

          {/* Size selector */}
          {variants.length > 0 && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[#696969] mb-3">
                Size{selectedSize ? ` — ${selectedSize}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.size}
                    onClick={() => setSelectedSize(v.size)}
                    disabled={v.stock === 0}
                    className={`w-12 h-12 text-sm border transition-colors ${
                      v.stock === 0
                        ? "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                        : selectedSize === v.size
                          ? "bg-black text-white border-black"
                          : "border-gray-300 hover:border-black"
                    }`}
                    title={
                      v.stock === 0 ? "Out of stock" : `${v.stock} available`
                    }
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Jersey Customization ── */}
          <div className="mb-8">
            {/* Toggle header */}
            <button
              type="button"
              onClick={() => setCustomizeEnabled((v) => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 border transition-colors ${
                customizeEnabled
                  ? "border-black bg-black text-white"
                  : "border-gray-200 hover:border-black text-black"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Pencil className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Customize Your Jersey</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[12px] font-semibold ${customizeEnabled ? "text-[#EDE735]" : "text-[#FA5D42]"}`}>
                  + Rs. {CUSTOMIZATION_FEE.toLocaleString()}
                </span>
                {/* Toggle pill */}
                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${customizeEnabled ? "bg-[#EDE735]" : "bg-gray-400"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${customizeEnabled ? "left-[calc(100%-1.125rem)]" : "left-0.5"}`} />
                </div>
              </div>
            </button>

            {/* Expanded form */}
            {customizeEnabled && (
              <div className="border border-t-0 border-black px-4 pt-4 pb-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Player Name */}
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#696969] mb-1.5">
                      Name on Jersey
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                      placeholder="e.g. RONALDO"
                      maxLength={12}
                      className="w-full border-b border-gray-300 py-2 text-sm font-medium tracking-widest outline-none focus:border-black transition-colors bg-transparent placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
                    />
                    <p className="text-[10px] text-[#aaa] mt-1">Max 12 characters</p>
                  </div>

                  {/* Player Number */}
                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#696969] mb-1.5">
                      Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={playerNumber}
                      onChange={(e) => setPlayerNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="e.g. 7"
                      maxLength={2}
                      className="w-full border-b border-gray-300 py-2 text-sm font-medium text-center tracking-widest outline-none focus:border-black transition-colors bg-transparent placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
                    />
                    <p className="text-[10px] text-[#aaa] mt-1">Up to 2 digits</p>
                  </div>
                </div>

                {/* Prepayment disclaimer */}
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 px-3 py-2.5 mt-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    <span className="font-semibold">Full advance payment is required</span> for customized jerseys. Your order will be processed only after payment is confirmed.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center border border-gray-300 h-12 w-32">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center font-semibold text-sm">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(stockCount || 99, q + 1))
                }
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!inStock || !selectedSize}
              className="flex-1 bg-black text-white h-12 text-sm font-medium tracking-wide hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!selectedSize
                ? "Select a size"
                : inStock
                  ? "Add to cart"
                  : "Out of stock"}
            </button>
          </div>

          {/* Delivery info */}
          <div className="flex flex-col gap-3 text-sm text-[#027D48] font-medium border-t border-gray-100 pt-6 mb-6">
            <div className="flex items-start gap-2.5">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z" />
              </svg>
              <span>Estimated delivery: 1–3 business days</span>
            </div>
            <div className="flex items-start gap-2.5">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z" />
              </svg>
              <span>Free 7-day returns for Danana Members</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-[18px] font-medium text-black mb-3">
                Description
              </h3>
              <p className="text-[14px] text-[#444] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Available kits summary */}
          {groups.length > 1 && (
            <div className="border-t border-gray-100 pt-5 text-[13px] text-[#696969]">
              <span className="font-medium text-black">Available kits: </span>
              {groups
                .map((g) => g.label)
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
