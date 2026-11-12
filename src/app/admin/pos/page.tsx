/*
=== Supabase SQL: আগে এই অংশটি SQL Editor-এ একবার চালান ===

CREATE SEQUENCE IF NOT EXISTS public.orders_token_number_seq;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number bigint;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.orders
  WHERE token_number IS NULL
)
UPDATE public.orders AS o
SET token_number = numbered.rn
FROM numbered
WHERE o.id = numbered.id;

SELECT setval(
  'public.orders_token_number_seq',
  COALESCE(MAX(token_number), 1),
  MAX(token_number) IS NOT NULL
)
FROM public.orders;

CREATE OR REPLACE FUNCTION public.assign_order_token_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.token_number IS NULL THEN
    NEW.token_number := nextval('public.orders_token_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_assign_token_number ON public.orders;
CREATE TRIGGER orders_assign_token_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.assign_order_token_number();

CREATE UNIQUE INDEX IF NOT EXISTS orders_token_number_unique
ON public.orders(token_number);

=== এরপর এই ফাইলটি আপনার বর্তমান POS page-এর বদলে বসান ===
ধারণা: order_items-এ order_id, item_name, quantity, price কলাম আছে;
restaurant_tables-এ id, table_number, status কলাম আছে।
*/

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, RestaurantSettings } from '@/types'
import { useReactToPrint } from 'react-to-print'
import { CustomerReceipt } from '@/components/receipts/CustomerReceipt'
import { KitchenReceipt } from '@/components/receipts/KitchenReceipt'
import { toast } from 'sonner'
import { Receipt, Printer, CreditCard, DollarSign, Smartphone, CheckCircle, Search, Plus, Trash2 } from 'lucide-react'

type OrderRow = Order & { token_number?: number | string | null }
type RestaurantTable = { id: string; table_number: string | number; status: string }
type DraftItem = { item_name: string; quantity: number; price: number }

function tokenOf(order: Order): string {
  const token = (order as OrderRow).token_number
  return token == null ? '—' : String(token).padStart(3, '0')
}

function orderTypeOf(order: Order): string {
  if (order.order_type === 'dine_in') {
    const table = order.table?.table_number
    return table ? `Dine In · টেবিল ${table}` : 'Dine In'
  }
  if (order.order_type === 'delivery') return 'Delivery'
  return 'Take Away'
}

const statusText: Record<string, string> = {
  new: 'নতুন', preparing: 'রান্না হচ্ছে', ready: 'প্রস্তুত', served: 'পরিশোধিত', cancelled: 'বাতিল',
}

export default function PosBillingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [tableId, setTableId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discount, setDiscount] = useState(0)
  const [items, setItems] = useState<DraftItem[]>([{ item_name: '', quantity: 1, price: 0 }])
  const [activeReceipt, setActiveReceipt] = useState<Order | null>(null)
  const [activeKot, setActiveKot] = useState<Order | null>(null)
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurant_name: 'Pom Pom', address: 'Jhenaidah', phone: '', whatsapp: '', tax_rate: '0', currency_symbol: '৳',
  })
  const receiptRef = useRef<HTMLDivElement>(null)
  const kotRef = useRef<HTMLDivElement>(null)
  const printReceipt = useReactToPrint({ contentRef: receiptRef })
  const printKot = useReactToPrint({ contentRef: kotRef })

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0),
    [items],
  )
  const total = Math.max(0, subtotal - Number(discount || 0))

  useEffect(() => { void loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [ordersResult, tablesResult, settingsResult] = await Promise.all([
        supabase.from('orders').select('*, table:restaurant_tables(*), order_items(*)').order('created_at', { ascending: false }),
        supabase.from('restaurant_tables').select('id, table_number, status').eq('status', 'available').order('table_number'),
        supabase.from('settings').select('*'),
      ])
      if (ordersResult.error) throw ordersResult.error
      if (tablesResult.error) throw tablesResult.error
      if (settingsResult.error) throw settingsResult.error
      setOrders((ordersResult.data ?? []) as Order[])
      setTables((tablesResult.data ?? []) as RestaurantTable[])
      const map: Record<string, string> = {}
      settingsResult.data?.forEach((row) => { map[row.key] = row.value })
      setSettings((old) => ({
        ...old,
        restaurant_name: map.restaurant_name || old.restaurant_name,
        address: map.address || old.address,
        phone: map.phone || old.phone,
        whatsapp: map.whatsapp || old.whatsapp,
      }))
    } catch (error) {
      console.error(error)
      toast.error('অর্ডার লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  function updateItem(index: number, field: keyof DraftItem, value: string) {
    setItems((current) => current.map((item, i) => i === index
      ? { ...item, [field]: field === 'item_name' ? value : Number(value) }
      : item))
  }

  async function createCounterOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanItems = items.filter((item) => item.item_name.trim() && item.quantity > 0 && item.price >= 0)
    if (!cleanItems.length) return toast.error('অন্তত একটি আইটেমের নাম, পরিমাণ ও দাম দিন')
    if (orderType === 'dine_in' && !tableId) return toast.error('Dine In অর্ডারের জন্য টেবিল বেছে নিন')
    if (Number(discount) > subtotal) return toast.error('ছাড় সাবটোটালের বেশি হতে পারবে না')

    setSaving(true)
    let createdOrderId: string | null = null
    try {
      const { data: created, error: createError } = await supabase
        .from('orders')
        .insert({
          order_type: orderType,
          table_id: orderType === 'dine_in' ? tableId : null,
          customer_name: customerName.trim() || 'কাউন্টার কাস্টমার',
          customer_phone: customerPhone.trim() || null,
          subtotal,
          discount: Number(discount || 0),
          total,
          status: 'new',
        })
        .select('id')
        .single()
      if (createError) throw createError
      createdOrderId = created.id

      const { error: itemError } = await supabase.from('order_items').insert(
        cleanItems.map((item) => ({
          order_id: created.id,
          item_name: item.item_name.trim(),
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      )
      if (itemError) throw itemError

      if (orderType === 'dine_in' && tableId) {
        const { error: tableError } = await supabase.from('restaurant_tables').update({ status: 'occupied' }).eq('id', tableId)
        if (tableError) throw tableError
      }

      toast.success('অর্ডার তৈরি হয়েছে · সিরিয়াল POS তালিকায় দেখুন')
      setCustomerName('')
      setCustomerPhone('')
      setDiscount(0)
      setTableId('')
      setItems([{ item_name: '', quantity: 1, price: 0 }])
      await loadData()
    } catch (error) {
      if (createdOrderId) await supabase.from('orders').delete().eq('id', createdOrderId)
      console.error(error)
      toast.error(`অর্ডার তৈরি হয়নি: ${error instanceof Error ? error.message : 'অজানা ত্রুটি'}`)
    } finally {
      setSaving(false)
    }
  }

  async function payOrder(order: Order, method: 'cash' | 'bkash' | 'card') {
    try {
      const { error: billError } = await supabase.from('bills').insert({
        order_id: order.id, subtotal: order.subtotal, discount: order.discount,
        tax: 0, total: order.total, payment_method: method,
      })
      if (billError && !billError.message.toLowerCase().includes('unique')) throw billError
      const { error: updateError } = await supabase.from('orders').update({ status: 'served' }).eq('id', order.id)
      if (updateError) throw updateError
      if (order.table_id) await supabase.from('restaurant_tables').update({ status: 'available' }).eq('id', order.table_id)
      toast.success('পেমেন্ট সম্পন্ন হয়েছে')
      setActiveReceipt(order)
      window.setTimeout(() => printReceipt(), 150)
      await loadData()
    } catch (error) {
      toast.error(`পেমেন্টে সমস্যা: ${error instanceof Error ? error.message : 'অজানা ত্রুটি'}`)
    }
  }

  async function deleteOrder(order: Order) {
    if (!window.confirm('এই অর্ডারটি মুছে ফেলবেন?')) return
    try {
      const { error: billError } = await supabase.from('bills').delete().eq('order_id', order.id)
      if (billError) throw billError
      const { error: itemError } = await supabase.from('order_items').delete().eq('order_id', order.id)
      if (itemError) throw itemError
      const { error } = await supabase.from('orders').delete().eq('id', order.id)
      if (error) throw error
      await loadData()
      toast.success('অর্ডার মুছে ফেলা হয়েছে')
    } catch (error) {
      toast.error(`মুছতে সমস্যা: ${error instanceof Error ? error.message : 'অজানা ত্রুটি'}`)
    }
  }

  const visibleOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(search.trim().toLowerCase()) ||
    tokenOf(order).toLowerCase().includes(search.trim().toLowerCase()) ||
    Boolean(order.customer_name?.toLowerCase().includes(search.trim().toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <header className="border-b pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-black"><Receipt className="h-6 w-6 text-red-700" /> POS ও বিলিং কাউন্টার</h1>
        <p className="mt-1 text-xs text-neutral-500">Counter, Website ও Delivery—সব অর্ডারের একক সিরিয়াল তালিকা</p>
      </header>

      <form onSubmit={createCounterOrder} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">Counter থেকে নতুন অর্ডার</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold">অর্ডারের ধরন
            <select value={orderType} onChange={(e) => setOrderType(e.target.value as 'dine_in' | 'takeaway')} className="mt-1 w-full rounded border p-2">
              <option value="dine_in">Dine In</option><option value="takeaway">Take Away</option>
            </select>
          </label>
          {orderType === 'dine_in' && <label className="text-xs font-semibold">টেবিল
            <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="mt-1 w-full rounded border p-2">
              <option value="">টেবিল বেছে নিন</option>
              {tables.map((table) => <option key={table.id} value={table.id}>টেবিল {table.table_number}</option>)}
            </select>
          </label>}
          <label className="text-xs font-semibold">কাস্টমারের নাম
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="ঐচ্ছিক" />
          </label>
          <label className="text-xs font-semibold">ফোন নম্বর
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="ঐচ্ছিক" />
          </label>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => <div key={index} className="grid grid-cols-12 gap-2">
            <input className="col-span-6 rounded border p-2 text-sm" value={item.item_name} onChange={(e) => updateItem(index, 'item_name', e.target.value)} placeholder="আইটেমের নাম" />
            <input className="col-span-2 rounded border p-2 text-sm" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} aria-label="পরিমাণ" />
            <input className="col-span-3 rounded border p-2 text-sm" type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(index, 'price', e.target.value)} placeholder="একক দাম" aria-label="একক দাম" />
            <button type="button" className="col-span-1 flex justify-center text-red-600" onClick={() => setItems((old) => old.length > 1 ? old.filter((_, i) => i !== index) : old)} aria-label="আইটেম সরান"><Trash2 className="h-4 w-4" /></button>
          </div>)}
          <button type="button" onClick={() => setItems((old) => [...old, { item_name: '', quantity: 1, price: 0 }])} className="flex items-center gap-1 text-sm font-bold text-red-700"><Plus className="h-4 w-4" /> আইটেম যোগ করুন</button>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-3">
          <label className="text-xs font-semibold">ছাড়
            <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="mt-1 block w-32 rounded border p-2" />
          </label>
          <div className="text-right text-sm"><div>সাবটোটাল: ৳ {subtotal.toFixed(2)}</div><div className="font-black">মোট: ৳ {total.toFixed(2)}</div></div>
          <button disabled={saving} className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? 'তৈরি হচ্ছে…' : 'অর্ডার তৈরি করুন'}</button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">সব অর্ডার · একক সিরিয়াল</h2>
          <div className="flex gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded border p-2 text-sm" placeholder="সিরিয়াল বা নাম খুঁজুন" /><button type="button" onClick={() => void loadData()} className="rounded border px-3 py-2 text-sm">রিফ্রেশ</button></div>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 font-bold"><tr><th className="p-3">সিরিয়াল</th><th className="p-3">ধরন / টেবিল</th><th className="p-3">কাস্টমার</th><th className="p-3">আইটেম</th><th className="p-3">মোট</th><th className="p-3">স্ট্যাটাস</th><th className="p-3">পেমেন্ট / প্রিন্ট</th></tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan={7} className="p-6 text-center">লোড হচ্ছে…</td></tr> : visibleOrders.length === 0 ? <tr><td colSpan={7} className="p-6 text-center">কোনো অর্ডার নেই</td></tr> : visibleOrders.map((order) => <tr key={order.id}>
                <td className="p-3 font-black">{tokenOf(order)}</td><td className="p-3">{orderTypeOf(order)}</td>
                <td className="p-3">{order.customer_name || 'গেস্ট'}{order.customer_phone ? <div>{order.customer_phone}</div> : null}</td>
                <td className="p-3">{order.order_items?.map((item, i) => <div key={i}>{item.item_name} × {item.quantity}</div>)}</td>
                <td className="p-3 font-bold">৳ {order.total}</td><td className="p-3">{statusText[order.status] ?? order.status}</td>
                <td className="space-x-1 p-3">
                  {order.status !== 'served' && <><button type="button" onClick={() => void payOrder(order, 'cash')} title="ক্যাশ পেমেন্ট" className="rounded bg-emerald-600 p-1 text-white"><DollarSign className="h-4 w-4" /></button><button type="button" onClick={() => void payOrder(order, 'bkash')} title="বিকাশ পেমেন্ট" className="rounded bg-pink-600 p-1 text-white"><Smartphone className="h-4 w-4" /></button><button type="button" onClick={() => void payOrder(order, 'card')} title="কার্ড পেমেন্ট" className="rounded bg-blue-600 p-1 text-white"><CreditCard className="h-4 w-4" /></button></>}
                  {order.status === 'served' && <CheckCircle className="inline h-4 w-4 text-emerald-600" />}
                  <button type="button" onClick={() => { setActiveReceipt(order); window.setTimeout(() => printReceipt(), 150) }} title="বিল প্রিন্ট" className="rounded bg-red-700 p-1 text-white"><Printer className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { setActiveKot(order); window.setTimeout(() => printKot(), 150) }} title="কিচেন কপি প্রিন্ট" className="rounded bg-neutral-800 p-1 text-white"><Receipt className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void deleteOrder(order)} title="অর্ডার মুছুন" className="rounded bg-neutral-200 p-1 text-red-700"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <div className="hidden">
        {activeReceipt && <CustomerReceipt ref={receiptRef} order={activeReceipt} settings={settings} />}
        {activeKot && <KitchenReceipt ref={kotRef} order={activeKot} />}
      </div>
    </div>
  )
}
