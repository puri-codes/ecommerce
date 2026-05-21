'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { ProductCard } from './product-card';
import type { DbProduct } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

const GENDER_TABS = [
  { label: 'All',    value: 'all'    },
  { label: 'Men',    value: 'male'   },
  { label: 'Women',  value: 'female' },
  { label: 'Unisex', value: 'unisex' },
];

const SORT_OPTIONS = [
  { label: 'Newest',            value: 'newest'     },
  { label: 'Price: Low → High', value: 'price_asc'  },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Name: A → Z',       value: 'name_asc'   },
];

const SELECT_CLS =
  'border-b border-gray-200 py-2 pr-6 text-sm outline-none focus:border-black bg-transparent appearance-none cursor-pointer';

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  initialGender?:   string;
  initialCategory?: string;
  initialSize?:     string;
  initialSort?:     string;
  initialQ?:        string;
};

export function ProductListClient({
  initialGender   = 'all',
  initialCategory = 'all',
  initialSize     = 'all',
  initialSort     = 'newest',
  initialQ        = '',
}: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  // Local search query — filters instantly without URL round-trip
  const [query, setQuery] = useState(searchParams.get('q') ?? initialQ);

  // Derive filter values from URL (live) with initial prop fallbacks
  const gender   = searchParams.get('gender')   ?? (initialGender   === 'all' ? '' : initialGender   ?? '');
  const category = searchParams.get('category') ?? (initialCategory === 'all' ? '' : initialCategory ?? '');
  const size     = searchParams.get('size')      ?? (initialSize     === 'all' ? '' : initialSize     ?? '');
  const sort     = searchParams.get('sort')      ?? initialSort ?? 'newest';

  // Fetch products once
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Push updated URL param (empty string = remove param)
  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all' || value === 'newest') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Derive available categories from loaded products
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  // Derive available sizes (only sizes present in at least one product variant)
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => (p.variants ?? []).forEach((v) => set.add(v.size)));
    return SIZE_ORDER.filter((s) => set.has(s));
  }, [products]);

  // Apply filters + sort
  const filtered = useMemo(() => {
    let list = products;

    if (gender)   list = list.filter((p) => p.gender === gender);
    if (category) list = list.filter((p) => p.category === category);
    if (size)     list = list.filter((p) => (p.variants ?? []).some((v) => v.size === size));

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
      );
    }

    if (sort === 'price_asc')  list = [...list].sort((a, b) => Number(a.base_price) - Number(b.base_price));
    if (sort === 'price_desc') list = [...list].sort((a, b) => Number(b.base_price) - Number(a.base_price));
    if (sort === 'name_asc')   list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, gender, category, size, query, sort]);

  const hasFilters = !!gender || !!category || !!size || sort !== 'newest' || !!query.trim();

  function clearAll() {
    setQuery('');
    router.push(pathname, { scroll: false });
  }

  return (
    <div>
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 mb-10">

        {/* Gender tabs */}
        <div className="flex flex-wrap gap-2">
          {GENDER_TABS.map((tab) => {
            const active = (gender || 'all') === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setParam('gender', tab.value)}
                className={`px-5 py-2 text-sm border transition-colors ${
                  active
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 hover:border-black text-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Second row: search + selects + meta */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-gray-100 pb-5">

          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-0 top-2.5 h-4 w-4 text-[#aaa] pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full border-b border-gray-200 py-2 text-sm pl-6 outline-none focus:border-black bg-transparent"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-0 top-2.5 text-[#aaa] hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-1.5">Category</div>
              <select
                value={category || 'all'}
                onChange={(e) => setParam('category', e.target.value)}
                className={SELECT_CLS}
              >
                <option value="all">All</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Size */}
          {availableSizes.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-1.5">Size</div>
              <select
                value={size || 'all'}
                onChange={(e) => setParam('size', e.target.value)}
                className={SELECT_CLS}
              >
                <option value="all">All sizes</option>
                {availableSizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Sort */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-1.5">Sort by</div>
            <select
              value={sort || 'newest'}
              onChange={(e) => setParam('sort', e.target.value)}
              className={SELECT_CLS}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Count + clear */}
          <div className="ml-auto flex items-end gap-4 pb-0.5">
            {!loading && (
              <span className="text-sm text-[#696969]">
                {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
            {hasFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-sm text-[#696969] hover:text-black transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {gender && (
              <Chip label={GENDER_TABS.find((t) => t.value === gender)?.label ?? gender}
                    onRemove={() => setParam('gender', 'all')} />
            )}
            {category && (
              <Chip label={category} onRemove={() => setParam('category', 'all')} />
            )}
            {size && (
              <Chip label={`Size ${size}`} onRemove={() => setParam('size', 'all')} />
            )}
            {sort && sort !== 'newest' && (
              <Chip label={SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort}
                    onRemove={() => setParam('sort', 'newest')} />
            )}
            {query.trim() && (
              <Chip label={`"${query}"`} onRemove={() => setQuery('')} />
            )}
          </div>
        )}
      </div>

      {/* ── Product grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 text-center text-sm text-[#696969]">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[#696969] text-sm mb-5">No products match your filters.</p>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="border border-black px-6 py-2.5 text-sm hover:bg-black hover:text-white transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-10">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

// Small removable filter chip
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-gray-200 px-3 py-1 text-[12px]">
      {label}
      <button onClick={onRemove} className="text-[#696969] hover:text-black transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
