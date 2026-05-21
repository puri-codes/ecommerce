'use client';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import type { DbPromoCode } from '@/lib/types';

const EMPTY = {
  code: '', discount_percent: '10', max_discount: '',
  min_order_amount: '0', is_active: true, expires_at: '',
};

const CLS = 'w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-black transition-colors bg-transparent placeholder:text-[#aaa]';
const LBL = 'block text-[10px] uppercase tracking-[0.22em] text-[#696969] mb-1.5';

export function AdminPromoCodes() {
  const [codes,    setCodes]    = useState<DbPromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState(EMPTY);
  const [busy,     setBusy]     = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/promo-codes');
    if (res.ok) setCodes(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditId(null); setForm(EMPTY); setShowForm(true); }

  function openEdit(c: DbPromoCode) {
    setEditId(c.id);
    setForm({
      code: c.code,
      discount_percent: String(c.discount_percent),
      max_discount: c.max_discount ? String(c.max_discount) : '',
      min_order_amount: String(c.min_order_amount),
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditId(null); setForm(EMPTY); }

  function setF(key: string, value: string | boolean) {
    setForm(c => ({ ...c, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      code: form.code.toUpperCase().trim(),
      discount_percent: parseInt(form.discount_percent) || 10,
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
    };
    const res = await fetch(editId ? `/api/promo-codes/${editId}` : '/api/promo-codes', {
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
    await fetch(`/api/promo-codes/${id}`, { method: 'DELETE' });
    setCodes(c => c.filter(x => x.id !== id));
    setDeleteId(null);
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Promo Codes</h2>
          <p className="text-[13px] text-[#696969] mt-0.5">{codes.length} code{codes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors">
          <PlusCircle className="h-4 w-4" /> New code
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-medium">{editId ? 'Edit promo code' : 'New promo code'}</h3>
              <button onClick={closeForm} className="text-[#aaa] hover:text-black"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1">
                <label className={LBL}>Code <span className="text-[#FA5D42]">*</span></label>
                <input value={form.code} onChange={e => setF('code', e.target.value.toUpperCase())}
                  required placeholder="SAVE20" className={CLS} style={{ fontFamily: 'monospace' }} />
              </div>

              <div>
                <label className={LBL}>Discount % <span className="text-[#FA5D42]">*</span></label>
                <input type="number" value={form.discount_percent} onChange={e => setF('discount_percent', e.target.value)}
                  required min="1" max="100" className={CLS} placeholder="10" />
              </div>

              <div>
                <label className={LBL}>Max discount (Rs.) <span className="text-[#aaa] normal-case tracking-normal font-normal">· blank = no cap</span></label>
                <input type="number" value={form.max_discount} onChange={e => setF('max_discount', e.target.value)}
                  min="0" className={CLS} placeholder="1000" />
              </div>

              <div>
                <label className={LBL}>Min order (Rs.)</label>
                <input type="number" value={form.min_order_amount} onChange={e => setF('min_order_amount', e.target.value)}
                  min="0" className={CLS} placeholder="0" />
              </div>

              <div>
                <label className={LBL}>Expires on <span className="text-[#aaa] normal-case tracking-normal font-normal">· blank = never</span></label>
                <input type="date" value={form.expires_at} onChange={e => setF('expires_at', e.target.value)} className={CLS} />
              </div>

              <div className="flex items-end pb-2 gap-3">
                <button type="button" onClick={() => setF('is_active', !form.is_active)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${form.is_active ? 'bg-black' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.is_active ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-[13px]">{form.is_active ? 'Active' : 'Inactive'}</span>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                <button disabled={busy} className="bg-black text-white px-6 py-2.5 text-[13px] font-medium hover:bg-black/80 transition-colors disabled:opacity-50">
                  {busy ? 'Saving…' : editId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeForm} className="border border-gray-200 px-6 py-2.5 text-[13px] hover:border-black transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 p-8">
        {codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-[13px] text-[#696969]">No promo codes yet</p>
            <button onClick={openAdd} className="border border-black px-5 py-2 text-sm hover:bg-black hover:text-white transition-colors">Create first code</button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 overflow-hidden">
            <div className="hidden lg:grid grid-cols-[8rem_6rem_8rem_8rem_6rem_8rem_5.5rem] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {['Code','Discount','Max disc.','Min order','Status','Expires',''].map(h => (
                <div key={h} className="text-[10px] uppercase tracking-[0.22em] text-[#696969]">{h}</div>
              ))}
            </div>

            {codes.map(c => (
              <div key={c.id} className="grid grid-cols-[1fr_auto] lg:grid-cols-[8rem_6rem_8rem_8rem_6rem_8rem_5.5rem] gap-4 px-5 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50 transition-colors">
                <div className="font-mono text-[13px] font-medium">{c.code}</div>
                <div className="hidden lg:block text-[13px] font-medium text-[#FA5D42]">{c.discount_percent}%</div>
                <div className="hidden lg:block text-[13px] text-[#696969]">
                  {c.max_discount ? `Rs. ${Number(c.max_discount).toLocaleString()}` : '—'}
                </div>
                <div className="hidden lg:block text-[13px] text-[#696969]">
                  {Number(c.min_order_amount) > 0 ? `Rs. ${Number(c.min_order_amount).toLocaleString()}` : '—'}
                </div>
                <div className="hidden lg:block">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium border ${c.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-[#696969] border-gray-200'}`}>
                    {c.is_active ? 'Active' : 'Off'}
                  </span>
                </div>
                <div className="hidden lg:block text-[12px] text-[#696969]">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry'}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(c)} className="flex items-center gap-1.5 border border-gray-200 px-2.5 py-1.5 text-[12px] hover:border-black transition-colors">
                    <Pencil className="h-3 w-3" /><span className="hidden sm:inline">Edit</span>
                  </button>
                  <button onClick={() => setDeleteId(c.id)} className="border border-gray-200 p-1.5 text-[#FA5D42] hover:border-[#FA5D42] transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-[17px] font-medium mb-2">Delete promo code?</h3>
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
