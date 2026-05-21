'use client';
import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import type { DbCombo, ComboItem, DbProduct } from '@/lib/types';

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type FormState = {
  name: string; slug: string; description: string; is_active: boolean;
  items: ComboItem[]; original_price: string; combo_price: string;
  image_url: string; meta_title: string; meta_description: string;
};

const EMPTY: FormState = {
  name: '', slug: '', description: '', is_active: true,
  items: [], original_price: '', combo_price: '',
  image_url: '', meta_title: '', meta_description: '',
};

const CLS = 'w-full border-b border-gray-200 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#aaa]';
const LBL = 'block text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-2';

function comboToForm(c: DbCombo): FormState {
  return {
    name: c.name, slug: c.slug, description: c.description ?? '',
    is_active: c.is_active, items: c.items ?? [],
    original_price: String(c.original_price), combo_price: String(c.combo_price),
    image_url: c.image_url ?? '', meta_title: c.meta_title ?? '', meta_description: c.meta_description ?? '',
  };
}

export function AdminCombos() {
  const router = useRouter();
  const [combos,   setCombos]   = useState<DbCombo[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [view,     setView]     = useState<'list' | 'form'>('list');
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<FormState>(EMPTY);
  const [busy,     setBusy]     = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addPid,   setAddPid]   = useState('');

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      fetch('/api/combos').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]);
    setCombos(Array.isArray(c) ? c : []);
    setProducts(Array.isArray(p) ? p : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditId(null); setForm(EMPTY); setView('form'); }
  function openEdit(c: DbCombo) { setEditId(c.id); setForm(comboToForm(c)); setView('form'); }
  function closeForm() { setView('list'); setEditId(null); setForm(EMPTY); }

  function setF<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(c => ({ ...c, [k]: v }));
  }

  function handleNameChange(name: string) {
    setForm(c => ({ ...c, name, slug: !c.slug || c.slug === toSlug(c.name) ? toSlug(name) : c.slug }));
  }

  function addProduct() {
    const p = products.find(p => p.id === addPid);
    if (!p || form.items.some(i => i.product_id === p.id)) return;
    const newItem: ComboItem = {
      product_id: p.id, product_name: p.name,
      image: p.image_groups?.[0]?.images?.[0] ?? '',
      base_price: Number(p.base_price),
    };
    const items = [...form.items, newItem];
    const autoOriginal = items.reduce((s, i) => s + i.base_price, 0);
    setForm(c => ({ ...c, items, original_price: String(autoOriginal) }));
    setAddPid('');
  }

  function removeItem(pid: string) {
    const items = form.items.filter(i => i.product_id !== pid);
    const autoOriginal = items.reduce((s, i) => s + i.base_price, 0);
    setForm(c => ({ ...c, items, original_price: String(autoOriginal) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      ...form,
      original_price: parseFloat(form.original_price) || 0,
      combo_price: parseFloat(form.combo_price) || 0,
    };
    const res = await fetch(editId ? `/api/combos/${editId}` : '/api/combos', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) return;
    await load();
    closeForm();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/combos/${id}`, { method: 'DELETE' });
    setCombos(c => c.filter(x => x.id !== id));
    setDeleteId(null);
  }

  const available = products.filter(p => !form.items.some(i => i.product_id === p.id));

  if (view === 'form') return (
    <div className="max-w-2xl mx-auto px-6 lg:px-10 py-8">
      <button onClick={closeForm} className="flex items-center gap-2 text-[13px] text-[#696969] hover:text-black mb-7 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Combos
      </button>
      <h2 className="text-2xl font-medium mb-1">{editId ? 'Edit combo' : 'New combo'}</h2>
      <p className="text-[13px] text-[#696969] mb-8">Bundle multiple products at a discounted price.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <Sec title="Basic">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className={LBL}>Name</label>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)} required className={CLS} placeholder="e.g. Home + Away Bundle" />
            </div>
            <div>
              <label className={LBL}>Slug</label>
              <input value={form.slug} onChange={e => setF('slug', e.target.value)} required className={CLS} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button type="button" onClick={() => setF('is_active', !form.is_active)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${form.is_active ? 'bg-black' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.is_active ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-[13px]">{form.is_active ? 'Active' : 'Draft'}</span>
            </div>
          </div>
          <div className="mt-6">
            <label className={LBL}>Description</label>
            <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={2} className={CLS + ' resize-none'} placeholder="What does this bundle include?" />
          </div>
        </Sec>

        <Sec title="Products in bundle">
          {/* Add product */}
          {available.length > 0 && (
            <div className="flex gap-3 mb-4">
              <select value={addPid} onChange={e => setAddPid(e.target.value)}
                className="flex-1 border-b border-gray-200 py-2 text-sm outline-none focus:border-black bg-transparent appearance-none cursor-pointer">
                <option value="">Select product to add…</option>
                {available.map(p => <option key={p.id} value={p.id}>{p.name} — Rs. {Number(p.base_price).toLocaleString()}</option>)}
              </select>
              <button type="button" onClick={addProduct} disabled={!addPid}
                className="border border-black px-4 py-2 text-[13px] hover:bg-black hover:text-white transition-colors disabled:opacity-40">
                Add
              </button>
            </div>
          )}

          {form.items.length === 0 ? (
            <p className="text-[13px] text-[#aaa] py-4 text-center border border-dashed border-gray-200">No products added yet</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {form.items.map(item => (
                <div key={item.product_id} className="flex items-center gap-3 py-3">
                  {item.image && <img src={item.image} alt="" className="w-10 h-10 object-cover bg-gray-100 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">{item.product_name}</div>
                    <div className="text-[12px] text-[#696969]">Rs. {item.base_price.toLocaleString()}</div>
                  </div>
                  <button type="button" onClick={() => removeItem(item.product_id)} className="text-[#aaa] hover:text-black">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Sec>

        <Sec title="Pricing">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className={LBL}>Original price (Rs.) <span className="text-[#aaa] normal-case tracking-normal font-normal">· auto-calculated</span></label>
              <input type="number" value={form.original_price} onChange={e => setF('original_price', e.target.value)} className={CLS} placeholder="0" />
            </div>
            <div>
              <label className={LBL}>Combo price (Rs.) <span className="text-[#aaa] normal-case tracking-normal font-normal">· the discounted price</span></label>
              <input type="number" value={form.combo_price} onChange={e => setF('combo_price', e.target.value)} required className={CLS} placeholder="0" />
            </div>
          </div>
          {form.original_price && form.combo_price && (
            <p className="mt-3 text-[13px] text-[#027D48] font-medium">
              Saves Rs. {(parseFloat(form.original_price) - parseFloat(form.combo_price)).toLocaleString()}
              {' '}({Math.round((1 - parseFloat(form.combo_price) / parseFloat(form.original_price)) * 100)}% off)
            </p>
          )}
        </Sec>

        <Sec title="SEO">
          <div className="grid gap-5">
            <div>
              <label className={LBL}>Meta title</label>
              <input value={form.meta_title} onChange={e => setF('meta_title', e.target.value)} className={CLS} placeholder={form.name ? `${form.name} | DANANA` : ''} />
            </div>
            <div>
              <label className={LBL}>Meta description</label>
              <textarea value={form.meta_description} onChange={e => setF('meta_description', e.target.value)} rows={2} className={CLS + ' resize-none'} />
            </div>
          </div>
        </Sec>

        <div className="flex gap-3 py-6 border-t border-gray-100">
          <button disabled={busy} className="bg-black text-white px-8 py-3 text-[13px] font-medium hover:bg-black/80 transition-colors disabled:opacity-50">
            {busy ? 'Saving…' : editId ? 'Update combo' : 'Create combo'}
          </button>
          <button type="button" onClick={closeForm} className="border border-gray-200 px-8 py-3 text-[13px] hover:border-black transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Combos</h2>
          <p className="text-[13px] text-[#696969] mt-0.5">{combos.length} bundle{combos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors">
          <PlusCircle className="h-4 w-4" /> New combo
        </button>
      </div>

      <div className="flex-1 p-8">
        {combos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-[13px] text-[#696969]">No combos yet</p>
            <button onClick={openAdd} className="border border-black px-5 py-2 text-sm hover:bg-black hover:text-white transition-colors">Create first combo</button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 overflow-hidden">
            <div className="hidden lg:grid grid-cols-[1fr_10rem_8rem_8rem_6rem_6.5rem] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['Combo', 'Products', 'Original', 'Bundle price', 'Status', ''].map(h => (
                <div key={h} className="text-[10px] uppercase tracking-[0.22em] text-[#696969]">{h}</div>
              ))}
            </div>
            {combos.map(combo => {
              const savings = Number(combo.original_price) - Number(combo.combo_price);
              return (
                <div key={combo.id} className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_10rem_8rem_8rem_6rem_6.5rem] gap-4 px-5 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-[14px] font-medium">{combo.name}</div>
                    <div className="text-[12px] text-[#696969]">{combo.slug}</div>
                  </div>
                  <div className="hidden lg:block text-[13px] text-[#696969]">{(combo.items ?? []).length} items</div>
                  <div className="hidden lg:block text-[13px] text-[#696969] line-through">Rs. {Number(combo.original_price).toLocaleString()}</div>
                  <div className="hidden lg:block">
                    <div className="text-[14px] font-medium text-[#FA5D42]">Rs. {Number(combo.combo_price).toLocaleString()}</div>
                    {savings > 0 && <div className="text-[11px] text-[#027D48]">Save Rs. {savings.toLocaleString()}</div>}
                  </div>
                  <div className="hidden lg:block">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium border ${combo.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-[#696969] border-gray-200'}`}>
                      {combo.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openEdit(combo)} className="flex items-center gap-1.5 border border-gray-200 px-2.5 py-1.5 text-[12px] hover:border-black transition-colors">
                      <Pencil className="h-3 w-3" /><span className="hidden sm:inline">Edit</span>
                    </button>
                    <button onClick={() => setDeleteId(combo.id)} className="border border-gray-200 p-1.5 text-[#FA5D42] hover:border-[#FA5D42] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-[17px] font-medium mb-2">Delete combo?</h3>
            <p className="text-[13px] text-[#696969] mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-black text-white py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 py-2.5 text-[13px] hover:border-black transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#696969] pb-4 mb-5 border-b border-gray-100">{title}</h3>
      {children}
    </section>
  );
}
