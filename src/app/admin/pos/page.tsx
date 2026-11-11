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
  X,
} from 'lucide-react'

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

  const handlePrintCustomerReceipt = useReactToPrint({
    contentRef: customerReceiptRef,
  })

  const handlePrintKitchenReceipt = useReactToPrint({
    contentRef: kitchenReceiptRef,
  })

  useEffect(() => {
    fetchOrders()
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

      if (ordersRes.data) setOrders(ordersRes.data)
      if (settingsRes.data) {
        const map: Record<string, string> = {}
        settingsRes.data.forEach((s) => (map[s.key] = s.value))
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
      toast.error('অর্ডার লোড করতে সমস্যা হয়েছে')
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

      if (billError && !billError.message.includes('unique')) {
        throw billError
      }

      await supabase.from('orders').update({ status: 'served' }).eq('id', order.id)

      if (order.table_id) {
        await supabase
          .from('restaurant_tables')
          .update({ status: 'available' })
          .eq('id', order.table_id)
      }

      toast.success(`বিল পরিশোধ সম্পন্ন (${method.toUpperCase()})`)
      fetchOrders()
      printCustomer(order)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('বিল প্রসেস করতে সমস্যা: ' + msg)
    }
  }

  // Delete Individual Order
  async function handleDeleteOrder(orderId: string) {
    if (!confirm('আপনি কি এই অর্ডারটি মুছে ফেলতে চান?')) return
    try {
      // First delete associated bills and order_items
      await supabase.from('bills').delete().eq('order_id', orderId)
      await supabase.from('order_items').delete().eq('order_id', orderId)
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) throw error

      toast.success('অর্ডারটি সফলভাবে মুছে ফেলা হয়েছে!')
      fetchOrders()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('মুছতে সমস্যা: ' + msg)
    }
  }

  // Reset ALL Orders & Bills (Fresh Start)
  async function handleResetAllOrders() {
    try {
      await supabase.from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('restaurant_tables').update({ status: 'available' }).neq('id', '00000000-0000-0000-0000-000000000000')

      // Also clear offline local storage queue
      localStorage.removeItem('pompom_offline_orders')

      toast.success('সকল টেস্ট অর্ডার ও বিল সফলভাবে রিসেট করা হয়েছে!')
      setIsResetConfirmOpen(false)
      fetchOrders()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('রিসেট করতে সমস্যা: ' + msg)
    }
  }

  function printCustomer(order: Order) {
    setActiveOrderForReceipt(order)
    setTimeout(() => {
      handlePrintCustomerReceipt()
    }, 150)
  }

  function printKot(order: Order) {
    setActiveOrderForKot(order)
    setTimeout(() => {
      handlePrintKitchenReceipt()
    }, 150)
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#CC0000]" />
            POS ও বিলিং কাউন্টার
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            অর্ডারের বিল তৈরি, ক্যাশ/বিকাশ পেমেন্ট গ্রহণ এবং থার্মাল প্রিন্টিং (Customer & Kitchen Copy)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Reset All Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span>সব অর্ডার রিসেট করুন</span>
          </button>

          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="টোকেন বা নাম..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-neutral-300 rounded-lg focus:outline-none"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="new">নতুন</option>
            <option value="preparing">রান্না হচ্ছে</option>
            <option value="ready">প্রস্তুত</option>
            <option value="served">পরিশোধিত/সার্ভড</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
              <tr>
                <th className="p-3">টোকেন নং</th>
                <th className="p-3">ধরণ</th>
                <th className="p-3">কাস্টমার</th>
                <th className="p-3">আইটেমসমূহ</th>
                <th className="p-3">মোট বিল</th>
                <th className="p-3">স্ট্যাটাস</th>
                <th className="p-3 text-center">কুইক পেমেন্ট</th>
                <th className="p-3 text-center">প্রিন্ট অপশন</th>
                <th className="p-3 text-right">মুছুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    বিল লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-400">
                    কোনো অর্ডার পাওয়া যায়নি। কাস্টমার মেনু থেকে নতুন অর্ডার দেওয়া হলে এখানে চলে আসবে।
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/80">
                    <td className="p-3 font-mono font-black text-neutral-800">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3 font-semibold">
                      {order.order_type === 'dine_in'
                        ? `টেবিল #${order.table?.table_number || 'N/A'}`
                        : 'পার্সেল'}
                    </td>
                    <td className="p-3 text-neutral-600">
                      <div className="font-bold text-neutral-900">{order.customer_name || 'গেস্ট'}</div>
                      {order.customer_phone && (
                        <div className="text-[10px] text-neutral-400 font-mono">{order.customer_phone}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs space-y-0.5">
                        {order.order_items?.map((it, idx) => (
                          <span key={idx} className="inline-block bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-[10px] mr-1">
                            {it.item_name} ({it.quantity}x)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-black text-sm text-[#CC0000]">
                      ৳ {order.total}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.status === 'served'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'ready'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Quick Payment Buttons */}
                    <td className="p-3 text-center">
                      {order.status !== 'served' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePayment(order, 'cash')}
                            title="ক্যাশ পেমেন্ট"
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" />
                            ক্যাশ
                          </button>
                          <button
                            onClick={() => handlePayment(order, 'bkash')}
                            title="বিকাশ পেমেন্ট"
                            className="px-2 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded font-bold text-[10px] flex items-center gap-1"
                          >
                            <Smartphone className="w-3 h-3" />
                            বিকাশ
                          </button>
                          <button
                            onClick={() => handlePayment(order, 'card')}
                            title="কার্ড পেমেন্ট"
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            কার্ড
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          পরিশোধিত
                        </span>
                      )}
                    </td>

                    {/* Double Print Buttons */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => printCustomer(order)}
                          title="কাস্টমার কপি থার্মাল প্রিন্ট"
                          className="px-2.5 py-1 bg-[#CC0000] hover:bg-red-700 text-white rounded font-bold text-[10px] flex items-center gap-1 shadow-sm"
                        >
                          <Printer className="w-3 h-3 text-yellow-300" />
                          Customer Copy
                        </button>

                        <button
                          onClick={() => printKot(order)}
                          title="কিচেন কপি (KOT) প্রিন্ট"
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-black text-white rounded font-bold text-[10px] flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-neutral-300" />
                          Kitchen Copy (KOT)
                        </button>
                      </div>
                    </td>

                    {/* Delete Individual Order */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        title="অর্ডারটি মুছুন"
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center text-neutral-900">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-neutral-900">
                সকল অর্ডার হিস্ট্রি রিসেট করতে চান?
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                এটি করলে এখন পর্যন্ত নেওয়া সমস্ত টেস্ট অর্ডার, টোকেন ও বিলিং ডাটা মুছে যাবে এবং সব ডাইনিং টেবিল ফ্রি হয়ে যাবে। তবে আপনার মেনু ও কাঁচামাল সংরক্ষিত থাকবে।
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleResetAllOrders}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
              >
                হ্যাঁ, সব রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Thermal Print Elements */}
      <div className="hidden">
        {activeOrderForReceipt && (
          <CustomerReceipt ref={customerReceiptRef} order={activeOrderForReceipt} settings={settings} />
        )}
        {activeOrderForKot && (
          <KitchenReceipt ref={kitchenReceiptRef} order={activeOrderForKot} />
        )}
      </div>
    </div>
  )
}
