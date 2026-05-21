'use client';
import type { FormEvent, ChangeEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, X } from 'lucide-react';
import { ImageGroupEditor } from './image-group-editor';

// ─── Cloudinary ───────────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file.');
  }

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body }
  );
  if (!res.ok) throw new Error('Cloudinary upload failed');

  const data = await res.json();
  const publicId: string = data.public_id;
  if (!publicId) throw new Error('Cloudinary response missing public_id');
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = { size: string; stock: number };
type ImageGroup = { label: string; images: string[] };

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  gender: string;
  base_price: string | number;
  compare_price: string | number | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  is_active: boolean;
  variants: Variant[];
  image_groups: ImageGroup[];
};

type FormVariant    = { size: string; stock: string };
type FormImageGroup = { label: string; urls: string[] };

type FormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  gender: 'male' | 'female' | 'unisex';
  base_price: string;
  compare_price: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_active: boolean;
  variants: FormVariant[];
  image_groups: FormImageGroup[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
const CATEGORIES = ['Jersey', 'T-Shirt', 'Hoodie', 'Polo', 'Shorts', 'Jacket', 'Tracksuit', 'Socks', 'Cap', 'Other'];

const EMPTY_FORM: FormState = {
  name: '', slug: '', description: '', category: 'Jersey', gender: 'unisex',
  base_price: '', compare_price: '',
  meta_title: '', meta_description: '', meta_keywords: '',
  is_active: true,
  variants: [{ size: 'M', stock: '0' }],
  image_groups: [{ label: '', urls: [] }],
};

const CLS_INPUT  = 'w-full border-b border-gray-200 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#aaa]';
const CLS_SELECT = 'w-full border-b border-gray-200 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent appearance-none cursor-pointer';
const CLS_LABEL  = 'block text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function productToForm(p: AdminProduct): FormState {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? '',
    category: p.category ?? 'Jersey',
    gender: (p.gender as FormState['gender']) ?? 'unisex',
    base_price: String(p.base_price),
    compare_price: p.compare_price ? String(p.compare_price) : '',
    meta_title: p.meta_title ?? '',
    meta_description: p.meta_description ?? '',
    meta_keywords: p.meta_keywords ?? '',
    is_active: p.is_active ?? true,
    variants: (p.variants ?? []).length > 0
      ? p.variants.map((v) => ({ size: v.size, stock: String(v.stock) }))
      : [{ size: 'M', stock: '0' }],
    image_groups: (p.image_groups ?? []).length > 0
      ? p.image_groups.map((g) => ({ label: g.label, urls: g.images ?? [] }))
      : [{ label: '', urls: [] }],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  product?: AdminProduct;   // undefined = new product
};

export function AdminProductForm({ product }: Props) {
  const router  = useRouter();
  const isEdit  = !!product;

  const [form,  setForm]  = useState<FormState>(product ? productToForm(product) : EMPTY_FORM);
  const [busy,  setBusy]  = useState(false);
  const [uploadingGroup, setUploadingGroup] = useState<number | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form field helpers ────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((c) => ({
      ...c,
      name,
      slug: !c.slug || c.slug === toSlug(c.name) ? toSlug(name) : c.slug,
    }));
  }

  // Variants
  const addVariant = () =>
    setForm((c) => ({ ...c, variants: [...c.variants, { size: 'M', stock: '0' }] }));
  const removeVariant = (i: number) =>
    setForm((c) => ({ ...c, variants: c.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i: number, field: keyof FormVariant, value: string) =>
    setForm((c) => ({
      ...c,
      variants: c.variants.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)),
    }));

  // Image groups
  const addGroup = () =>
    setForm((c) => ({ ...c, image_groups: [...c.image_groups, { label: '', urls: [] }] }));
  const removeGroup = (i: number) =>
    setForm((c) => ({ ...c, image_groups: c.image_groups.filter((_, idx) => idx !== i) }));
  const updateGroupLabel = (i: number, label: string) =>
    setForm((c) => ({
      ...c,
      image_groups: c.image_groups.map((g, idx) => (idx === i ? { ...g, label } : g)),
    }));
  const addImageToGroup = (i: number, url: string) =>
    setForm((c) => ({
      ...c,
      image_groups: c.image_groups.map((g, idx) =>
        idx === i ? { ...g, urls: [...g.urls, url] } : g
      ),
    }));
  const removeImageFromGroup = (gi: number, ii: number) =>
    setForm((c) => ({
      ...c,
      image_groups: c.image_groups.map((g, idx) =>
        idx === gi ? { ...g, urls: g.urls.filter((_, i) => i !== ii) } : g
      ),
    }));

  // ── Cloudinary upload ────────────────────────────────────────────────────

  function triggerUpload(groupIndex: number) {
    setUploadingGroup(groupIndex);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploadingGroup === null) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      addImageToGroup(uploadingGroup, url);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
      setUploadingGroup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      category: form.category,
      gender: form.gender,
      base_price: parseFloat(form.base_price) || 0,
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      is_active: form.is_active,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      meta_keywords: form.meta_keywords || null,
      variants: form.variants
        .filter((v) => v.size)
        .map((v) => ({ size: v.size, stock: parseInt(v.stock) || 0 })),
      image_groups: form.image_groups
        .filter((g) => g.label || g.urls.length > 0)
        .map((g) => ({ label: g.label, images: g.urls })),
    };

    const res = await fetch(
      isEdit ? `/api/products/${product!.id}` : '/api/products',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    setBusy(false);
    if (!res.ok) return;
    router.push('/admin');
    router.refresh();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-8">

      {/* Back */}
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 text-[13px] text-[#696969] hover:text-black mb-7 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-medium">{isEdit ? 'Edit product' : 'New product'}</h2>
        <p className="text-[13px] text-[#696969] mt-1">
          {isEdit ? 'Update the details below and save' : 'Fill in the details to add a product to your catalog'}
        </p>
      </div>

      {/* Hidden file input — shared across all image groups */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">

        {/* ── BASIC INFO ── */}
        <Section title="Basic information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <div className="sm:col-span-2">
              <label className={CLS_LABEL}>Name</label>
              <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Home Kit Jersey 2026" required className={CLS_INPUT} />
            </div>

            <div>
              <label className={CLS_LABEL}>Slug <span className="text-[#aaa] normal-case tracking-normal font-normal">· auto-filled, editable</span></label>
              <input value={form.slug} onChange={(e) => setField('slug', e.target.value)}
                placeholder="home-kit-jersey-2026" required className={CLS_INPUT} />
            </div>

            <div>
              <label className={CLS_LABEL}>Category</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)} className={CLS_SELECT}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={CLS_LABEL}>Gender</label>
              <select value={form.gender} onChange={(e) => setField('gender', e.target.value as FormState['gender'])} className={CLS_SELECT}>
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="button" role="switch" aria-checked={form.is_active}
                onClick={() => setField('is_active', !form.is_active)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none ${form.is_active ? 'bg-black' : 'bg-gray-300'}`}>
                <span className={`pointer-events-none absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.is_active ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-[13px]">{form.is_active ? 'Active — visible in store' : 'Draft — hidden from store'}</span>
            </div>
          </div>
        </Section>

        {/* ── DESCRIPTION ── */}
        <Section title="Description">
          <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
            rows={4} placeholder="Describe the product — material, fit, features…"
            className={CLS_INPUT + ' resize-none'} />
        </Section>

        {/* ── PRICING ── */}
        <Section title="Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className={CLS_LABEL}>Base price</label>
              <div className="relative">
                <span className="absolute left-0 top-2.5 text-sm text-[#aaa]">Rs.</span>
                <input value={form.base_price} onChange={(e) => setField('base_price', e.target.value)}
                  type="number" step="0.01" min="0" placeholder="0" required
                  className={CLS_INPUT + ' pl-9'} />
              </div>
            </div>
            <div>
              <label className={CLS_LABEL}>
                Compare-at price <span className="text-[#aaa] normal-case tracking-normal font-normal">· shown crossed out</span>
              </label>
              <div className="relative">
                <span className="absolute left-0 top-2.5 text-sm text-[#aaa]">Rs.</span>
                <input value={form.compare_price} onChange={(e) => setField('compare_price', e.target.value)}
                  type="number" step="0.01" min="0" placeholder="0"
                  className={CLS_INPUT + ' pl-9'} />
              </div>
            </div>
          </div>
        </Section>

        {/* ── SIZES & STOCK ── */}
        <Section title="Sizes &amp; stock">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[9rem_1fr_2rem] gap-4 items-center">
              <span className={CLS_LABEL + ' !mb-0'}>Size</span>
              <span className={CLS_LABEL + ' !mb-0'}>Stock</span>
              <span />
            </div>
            {form.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[9rem_1fr_2rem] gap-4 items-center">
                <select value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)}
                  className="border-b border-gray-200 py-2 text-sm outline-none focus:border-black bg-transparent appearance-none cursor-pointer">
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                  type="number" min="0"
                  className="border-b border-gray-200 py-2 text-sm text-center outline-none focus:border-black bg-transparent" />
                {form.variants.length > 1
                  ? <button type="button" onClick={() => removeVariant(i)} className="text-[#696969] hover:text-black transition-colors"><X className="h-4 w-4" /></button>
                  : <span />
                }
              </div>
            ))}
          </div>
          <button type="button" onClick={addVariant}
            className="mt-4 flex items-center gap-1.5 text-[13px] text-[#696969] hover:text-black transition-colors">
            <PlusCircle className="h-4 w-4" /> Add size
          </button>
        </Section>

        {/* ── IMAGES ── */}
        <Section title="Image groups">
          <ImageGroupEditor
            groups={form.image_groups}
            uploading={uploading}
            uploadingGroup={uploadingGroup}
            onLabelChange={updateGroupLabel}
            onAddImage={addImageToGroup}
            onRemoveImage={removeImageFromGroup}
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
            onTriggerUpload={triggerUpload}
          />
        </Section>

        {/* ── SEO ── */}
        <Section title="SEO">
          <div className="flex flex-col gap-6">
            <div>
              <label className={CLS_LABEL}>Meta title <span className="text-[#aaa] normal-case tracking-normal font-normal">· title tag in search results</span></label>
              <input value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)}
                placeholder={form.name ? `${form.name} | DANANA` : 'Product name | DANANA'}
                maxLength={70} className={CLS_INPUT} />
              <p className="mt-1 text-[11px] text-[#aaa]">{form.meta_title.length}/70</p>
            </div>
            <div>
              <label className={CLS_LABEL}>Meta description <span className="text-[#aaa] normal-case tracking-normal font-normal">· search snippet</span></label>
              <textarea value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)}
                rows={2} maxLength={160} placeholder="Brief description for search engines…"
                className={CLS_INPUT + ' resize-none'} />
              <p className="mt-1 text-[11px] text-[#aaa]">{form.meta_description.length}/160</p>
            </div>
            <div>
              <label className={CLS_LABEL}>Keywords <span className="text-[#aaa] normal-case tracking-normal font-normal">· comma-separated</span></label>
              <input value={form.meta_keywords} onChange={(e) => setField('meta_keywords', e.target.value)}
                placeholder="jersey, football, worldcup, home kit" className={CLS_INPUT} />
            </div>
          </div>
        </Section>

        {/* ── SUBMIT ── */}
        <div className="flex items-center gap-3 py-6 border-t border-gray-100">
          <button disabled={busy}
            className="bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-black/80 transition-colors disabled:opacity-50">
            {busy ? 'Saving…' : isEdit ? 'Update product' : 'Create product'}
          </button>
          <button type="button" onClick={() => router.push('/admin')}
            className="border border-gray-200 px-8 py-3 text-[13px] hover:border-black transition-colors">
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#696969] pb-4 mb-5 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </section>
  );
}
