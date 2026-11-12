'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, RestaurantSettings } from '@/types'
import { useReactToPrint } from 'react-to-print'
import { CustomerReceipt } from '@/components/receipts/CustomerReceipt'
import { KitchenReceipt } from '@/components/receipts/KitchenReceipt'
import { toast } from 'sonner'
import {
  Receipt,
  Printer,
  CreditCard,
  DollarSign,
  Smartphone,
  CheckCircle,
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'

type OrderWithToken = Order & {
  token_number?: number | string | null
  token_no?: number | string | null
  serial_number?: number | string | null
}

function getOrderToken(order: Order): string {
  const row = order as OrderWithToken
  const token = row.token_number ?? row.token_no ?? row.serial_number
  return token == null || token === '' ? 'সিরিয়াল নেই' : String(token).padStart(3, '0')
}

function getOrderTypeLabel(order: Order): string {
  const type = String(order.order_type ?? '').toLowerCase()

  if (type === 'dine_in' || type === 'house_in' || type === 'house-in') {
    const tableNumber = order.table?.table_number
    return tableNumber ? `Dine In · টেবিল ${tableNumber}` : 'Dine In'
  }
  if (type === 'takeaway' || type === 'take_away' || type === 'take-away') return 'Take Away'
  if (type === 'delivery') return 'Delivery'
  return 'অন্যান্য'
}

const statusLabels: Record<string, string> = {
  new: 'নতুন',
  preparing: 'রান্না হচ্ছে',
  ready: 'প্রস্তুত',
  served: 'পরিশোধিত / সার্ভড',
  cancelled: 'বাতিল',
}

export default function PosBillingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeOrderForReceipt, setActiveOrderForReceipt] = useState<Order | null>(null)
  const [activeOrderForKot, setActiveOrderForKot] = useState<Order | null>(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false)

  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurant_name: 'Pom Pom',
    address: 'Jhenaidah',
    phone: '',
    whatsapp: '',
    tax_rate: '0',
    currency_symbol: '৳',
  })

  const customerReceiptRef = useRef<HTMLDivElement>(null)
  const kitchenReceiptRef = useRef<HTMLDivElement>(null)

  const handlePrintCustomerReceipt = useReactToPrint({ contentRef: customerReceiptRef })
  const handlePrintKitchenReceipt = useReactToPrint({ contentRef: kitchenReceiptRef })

  useEffect(() => {
    void fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, table:restaurant_tables(*), order_items(*)')
          .order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
      ])

      if (ordersRes.error) throw ordersRes.error
      if (ordersRes.data) setOrders(ordersRes.data as Order[])

      if (settingsRes.error) throw settingsRes.error
      if (settingsRes.data) {
        const map: Record<string, string> = {}
        settingsRes.data.forEach((setting) => {
          map[setting.key] = setting.value
        })
        setSettings((prev) => ({
          ...prev,
          restaurant_name: map.restaurant_name || prev.restaurant_name,
          address: map.address || prev.address,
          phone: map.phone || prev.phone,
          whatsapp: map.whatsapp || prev.whatsapp,
        }))
      }
    } catch (err) {
      console.error(err)
      toast.error('অর্ডার লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment(order: Order, method: 'cash' | 'bkash' | 'nagad' | 'card') {
    try {
      const { error: billError } = await supabase.from('bills').insert({
        order_id: order.id,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: 0,
        total: order.total,
        payment_method: method,
      })

      if (billError && !billError.message.toLowerCase().includes('unique')) throw billError

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'served' })
        .eq('id', order.id)
      if (orderUpdateError) throw orderUpdateError

      if (order.table_id) {
        const { error: tableUpdateError } = await supabase
          .from('restaurant_tables')
          .update({ status: 'available' })
          .eq('id', order.table_id)
        if (tableUpdateError) throw tableUpdateError
      }

      const methodLabels = { cash: 'ক্যাশ', bkash: 'বিকাশ', nagad: 'নগদ', card: 'কার্ড' }
      toast.success(`বিল পরিশোধ সম্পন্ন · ${methodLabels[method]}`)
      await fetchOrders()
      printCustomer(order)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'অজানা ত্রুটি'
      toast.error(`বিল প্রসেস করতে সমস্যা: ${message}`)
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!confirm('আপনি কি এই অর্ডারটি মুছে ফেলতে চান?')) return

    try {
      const { error: billsError } = await supabase.from('bills').delete().eq('order_id', orderId)
      if (billsError) throw billsError

      const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', orderId)
      if (itemsError) throw itemsError

      const { error: orderError } = await supabase.from('orders').delete().eq('id', orderId)
      if (orderError) throw orderError

      toast.success('অর্ডারটি মুছে ফেলা হয়েছে')
      await fetchOrders()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'অজানা ত্রুটি'
      toast.error(`অর্ডার মুছতে সমস্যা: ${message}`)
    }
  }

  async function handleResetAllOrders() {
    try {
      const { error: billsError } = await supabase
        .from('bills')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (billsError) throw billsError

      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (itemsError) throw itemsError

      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (ordersError) throw ordersError

      const { error: tablesError } = await supabase
        .from('restaurant_tables')
        .update({ status: 'available' })
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (tablesError) throw tablesError

      localStorage.removeItem('pompom_offline_orders')
      toast.success('সব অর্ডার ও বিল রিসেট হয়েছে')
      setIsResetConfirmOpen(false)
      await fetchOrders()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'অজানা ত্রুটি'
      toast.error(`রিসেট করতে সমস্যা: ${message}`)
    }
  }

  function printCustomer(order: Order) {
    setActiveOrderForReceipt(order)
    window.setTimeout(() => handlePrintCustomerReceipt(), 150)
  }

  function printKot(order: Order) {
    setActiveOrderForKot(order)
    window.setTimeout(() => handlePrintKitchenReceipt(), 150)
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(normalizedSearch) ||
      getOrderToken(order).toLowerCase().includes(normalizedSearch) ||
      Boolean(order.customer_name?.toLowerCase().includes(normalizedSearch))
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-neutral-900">
            <Receipt className="h-6 w-6 text-[#CC0000]" />
            POS ও বিলিং কাউন্টার
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            অর্ডারের বিল তৈরি, পেমেন্ট গ্রহণ এবং Customer ও Kitchen Copy প্রিন্ট করুন
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            সব অর্ডার রিসেট
          </button>

          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              aria-label="অর্ডার খুঁজুন"
              placeholder="টোকেন বা নাম খুঁজুন…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
            />
          </div>

          <select
            aria-label="স্ট্যাটাস দিয়ে ফিল্টার"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-neutral-300 p-2 text-xs focus:outline-none"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="new">নতুন</option>
            <option value="preparing">রান্না হচ্ছে</option>
            <option value="ready">প্রস্তুত</option>
            <option value="served">পরিশোধিত / সার্ভড</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-neutral-50 font-bold text-neutral-600">
              <tr>
                <th className="p-3">টোকেন নং</th>
                <th className="p-3">ধরন</th>
                <th className="p-3">কাস্টমার</th>
                <th className="p-3">আইটেমসমূহ</th>
                <th className="p-3">মোট বিল</th>
                <th className="p-3">স্ট্যাটাস</th>
                <th className="p-3 text-center">দ্রুত পেমেন্ট</th>
                <th className="p-3 text-center">প্রিন্ট</th>
                <th className="p-3 text-right">মুছুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    অর্ডার লোড হচ্ছে…
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-400">
                    কোনো অর্ডার পাওয়া যায়নি। নতুন অর্ডার এলে এখানে দেখা যাবে।
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/80">
                    <td className="p-3 font-mono font-black text-neutral-800">{getOrderToken(order)}</td>
                    <td className="p-3 font-semibold">{getOrderTypeLabel(order)}</td>
                    <td className="p-3 text-neutral-600">
                      <div className="font-bold text-neutral-900">{order.customer_name || 'গেস্ট'}</div>
                      {order.customer_phone && (
                        <div className="font-mono text-[10px] text-neutral-400">{order.customer_phone}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs space-y-0.5">
                        {order.order_items?.map((item, index) => (
                          <span
                            key={index}
                            className="mr-1 inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-800"
                          >
                            {item.item_name} ({item.quantity}×)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-sm font-black text-[#CC0000]">৳ {order.total}</td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          order.status === 'served'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'ready'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {order.status !== 'served' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => void handlePayment(order, 'cash')}
                            title="ক্যাশ পেমেন্ট"
                            className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            <DollarSign className="h-3 w-3" /> ক্যাশ
                          </button>
                          <button
                            type="button"
                            onClick={() => void handlePayment(order, 'bkash')}
                            title="বিকাশ পেমেন্ট"
                            className="flex items-center gap-1 rounded bg-pink-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-pink-700"
                          >
                            <Smartphone className="h-3 w-3" /> বিকাশ
                          </button>
                          <button
                            type="button"
                            onClick={() => void handlePayment(order, 'card')}
                            title="কার্ড পেমেন্ট"
                            className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                          >
                            <CreditCard className="h-3 w-3" /> কার্ড
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" /> পরিশোধিত
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => printCustomer(order)}
                          title="কাস্টমার কপি প্রিন্ট"
                          className="flex items-center gap-1 rounded bg-[#CC0000] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-red-700"
                        >
                          <Printer className="h-3 w-3 text-yellow-300" /> কাস্টমার কপি
                        </button>
                        <button
                          type="button"
                          onClick={() => printKot(order)}
                          title="কিচেন কপি প্রিন্ট"
                          className="flex items-center gap-1 rounded bg-neutral-800 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-black"
                        >
                          <Printer className="h-3 w-3 text-neutral-300" /> কিচেন কপি (KOT)
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDeleteOrder(order.id)}
                        title="অর্ডার মুছুন"
                        aria-label="অর্ডার মুছুন"
                        className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center text-neutral-900 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">সব অর্ডার ও বিল রিসেট করবেন?</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                এই কাজ করলে সব অর্ডার, টোকেন ও বিলিং ডেটা মুছে যাবে এবং সব টেবিল ফাঁকা হবে। মেনু ও কাঁচামাল মুছবে না।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-xs font-bold text-neutral-600"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => void handleResetAllOrders()}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700"
              >
                হ্যাঁ, রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        {activeOrderForReceipt && (
          <CustomerReceipt ref={customerReceiptRef} order={activeOrderForReceipt} settings={settings} />
        )}
        {activeOrderForKot && <KitchenReceipt ref={kitchenReceiptRef} order={activeOrderForKot} />}
      </div>
    </div>
  )
}

// এই ফাইলটি অর্ডার দেখানো, পেমেন্ট ও প্রিন্টের জন্য। Counter থেকে নতুন অর্ডার
// তৈরি এবং Website/Counter-এর shared token বরাদ্দ অর্ডার তৈরির কোড ও database
// schema-তে করতে হবে। orders টেবিলে token_number না থাকলে টেবিলে 'সিরিয়াল নেই' দেখাবে।
