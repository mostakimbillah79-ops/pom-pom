'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, Ingredient } from '@/types'
import { useReactToPrint } from 'react-to-print'
import { KitchenReceipt } from '@/components/receipts/KitchenReceipt'
import { toast } from 'sonner'
import {
  ChefHat,
  Clock,
  Printer,
  CheckCircle,
  AlertTriangle,
  Flame,
  Volume2,
  RefreshCw,
  Package,
  Plus,
  Lock,
  X,
} from 'lucide-react'

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [filter, setFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null)
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false)

  // Quick Stock Add modal for Kitchen Staff (Quantity only - NO PRICE, NO RECIPE)
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false)
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null)
  const [addQty, setAddQty] = useState<string>('')

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  })

  useEffect(() => {
    // Check if staff is logged in
    const role = localStorage.getItem('pompom_user_role')
    if (role === 'kitchen' || role === 'admin') {
      setIsStaffAuthenticated(true)
    }

    fetchKitchenData()

    // Realtime subscription for orders
    const channel = supabase
      .channel('kitchen-live-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchKitchenData()
          if (payload.eventType === 'INSERT') {
            toast.info('🔔 কিচেনে নতুন অর্ডার এসেছে!', { duration: 5000 })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchKitchenData() {
    try {
      const [ordersRes, ingsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, table:restaurant_tables(*), order_items(*)')
          .neq('status', 'served')
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true }),
        supabase.from('ingredients').select('id, name, name_bn, unit, current_stock, total_purchased, min_stock_alert').order('name'),
      ])

      if (ordersRes.data) setOrders(ordersRes.data)
      if (ingsRes.data) setIngredients(ingsRes.data as Ingredient[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: Order['status']) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
          .filter((o) => newStatus !== 'served' || o.id !== orderId)
      )

      toast.success(`অর্ডার স্ট্যাটাস: ${newStatus.toUpperCase()}`)
    } catch (err: unknown) {
      console.error(err)
      toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে')
    }
  }

  function triggerPrint(order: Order) {
    setSelectedOrderForPrint(order)
    setTimeout(() => {
      handlePrint()
    }, 150)
  }

  // Kitchen Staff Quantity-Only Stock Update (NO COST, NO RECIPE)
  async function handleAddStockQuantity() {
    if (!selectedIng || Number(addQty) <= 0) {
      toast.error('সঠিক পরিমাণ লিখুন')
      return
    }

    try {
      const newStock = Number(selectedIng.current_stock || 0) + Number(addQty)
      const newTotal = Number(selectedIng.total_purchased || 0) + Number(addQty)

      const { error } = await supabase
        .from('ingredients')
        .update({
          current_stock: newStock,
          total_purchased: newTotal,
        })
        .eq('id', selectedIng.id)

      if (error) throw error

      toast.success(`${selectedIng.name_bn || selectedIng.name} স্টকে +${addQty} ${selectedIng.unit} যুক্ত হয়েছে!`)
      setIsStockModalOpen(false)
      setSelectedIng(null)
      setAddQty('')
      fetchKitchenData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('স্টক আপডেট ব্যর্থ: ' + message)
    }
  }

  // Stock items with >= 80% usage
  const lowStockIngredients = ingredients.filter((ing) => {
    if (ing.total_purchased > 0) {
      const usedPercent = ((ing.total_purchased - ing.current_stock) / ing.total_purchased) * 100
      return usedPercent >= 80 || ing.current_stock <= ing.min_stock_alert
    }
    return ing.current_stock <= 50
  })

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  // If staff is not logged in
  if (!isStaffAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border-2 border-amber-300 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <ChefHat className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-neutral-900">কিচেন ডিসপ্লে (স্টাফ এরিয়া)</h2>
        <p className="text-xs text-neutral-500">
          এই স্ক্রিনটি শুধুমাত্র বাবুর্চি ও কিচেন কর্মীদের জন্য। কিচেন পিন কোড দিয়ে লগইন করুন।
        </p>
        <button
          onClick={() => {
            const role = localStorage.getItem('pompom_user_role')
            if (role === 'kitchen' || role === 'admin') {
              setIsStaffAuthenticated(true)
            } else {
              window.location.href = '/'
            }
          }}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow"
        >
          লগইন করতে হোমপেজে যান (বা উপরে স্টাফ লগইনে ক্লিক করুন)
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-[#CC0000] rounded-xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl text-amber-700 shadow-md">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wide text-yellow-300">
              POM POM কিচেন কন্ট্রোল ডিসপ্লে
            </h1>
            <p className="text-xs text-amber-100">
              শেফ ও কিচেন কর্মীদের জন্য লাইভ অর্ডার, KOT প্রিন্ট ও কাঁচামাল স্টক আপডেট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchKitchenData()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold backdrop-blur-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            রিফ্রেশ
          </button>
          <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg text-xs font-bold text-yellow-300">
            <Volume2 className="w-4 h-4" />
            <span>লাইভ স্ক্রিন</span>
          </div>
        </div>
      </div>

      {/* Staff Raw Materials & 80% Stock Notification Strip */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs text-neutral-800">
              কিচেন কাঁচামাল স্টক পর্যবেক্ষণ (কোনো গোপন রেসিপি বা দাম নেই)
            </h3>
          </div>
          {lowStockIngredients.length > 0 && (
            <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded animate-pulse">
              ⚠️ {lowStockIngredients.length}টি কাঁচামাল ৮০%+ শেষ!
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {ingredients.map((ing) => {
            const used = Number(ing.total_purchased || 0) - Number(ing.current_stock || 0)
            const percentUsed =
              ing.total_purchased > 0
                ? Math.min(100, Math.round((used / Number(ing.total_purchased)) * 100))
                : 0
            const isLow = percentUsed >= 80 || Number(ing.current_stock) <= Number(ing.min_stock_alert)

            return (
              <div
                key={ing.id}
                className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                  isLow ? 'bg-red-50 border-red-300 text-red-900' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div>
                  <div className="font-bold truncate">{ing.name_bn || ing.name}</div>
                  <div className={`font-black text-sm mt-0.5 ${isLow ? 'text-red-600' : 'text-neutral-800'}`}>
                    {ing.current_stock} {ing.unit}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedIng(ing)
                    setIsStockModalOpen(true)
                  }}
                  className="mt-2 w-full py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  + স্টক যোগ
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Order Status Filters */}
      <div className="flex gap-2 border-b border-neutral-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            filter === 'all'
              ? 'bg-[#CC0000] text-white shadow'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          সব পেন্ডিং অর্ডার ({orders.length})
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            filter === 'new'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          নতুন ({orders.filter((o) => o.status === 'new').length})
        </button>
        <button
          onClick={() => setFilter('preparing')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            filter === 'preparing'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          রান্না হচ্ছে ({orders.filter((o) => o.status === 'preparing').length})
        </button>
        <button
          onClick={() => setFilter('ready')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            filter === 'ready'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          পরিবেশন প্রস্তুত ({orders.filter((o) => o.status === 'ready').length})
        </button>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="p-8 text-center text-neutral-500">অর্ডার লোড হচ্ছে...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200 text-neutral-400">
          <ChefHat className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
          <p className="font-bold text-neutral-600">বর্তমানে কোনো পেন্ডিং অর্ডার নেই</p>
          <p className="text-xs text-neutral-400 mt-1">নতুন অর্ডার আসলে স্বয়ংক্রিয়ভাবে কিচেন স্ক্রিনে বেজে উঠবে</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const timeAgo = new Date(order.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })

            const statusColor =
              order.status === 'new'
                ? 'border-blue-500 bg-blue-50/20'
                : order.status === 'preparing'
                ? 'border-amber-500 bg-amber-50/20'
                : 'border-emerald-500 bg-emerald-50/20'

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border-2 ${statusColor} p-5 shadow-md flex flex-col justify-between space-y-4`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div>
                    <span className="text-base font-black text-neutral-900 block">
                      {order.order_type === 'dine_in'
                        ? `টেবিল #${order.table?.table_number || 'N/A'}`
                        : 'পার্সেল / টেকঅ্যাওয়ে'}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      টোকেন: #{order.id.slice(0, 6).toUpperCase()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[11px] font-black uppercase px-2 py-0.5 rounded ${
                        order.status === 'new'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'preparing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {order.status === 'new'
                        ? 'নতুন'
                        : order.status === 'preparing'
                        ? 'রান্না হচ্ছে'
                        : 'প্রস্তুত'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-1 justify-end">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 flex-1">
                  {order.order_items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-lg border border-neutral-200"
                    >
                      <span className="font-bold text-sm text-neutral-800">
                        {item.item_name}
                      </span>
                      <span className="bg-black text-white font-black text-sm px-2.5 py-0.5 rounded">
                        {item.quantity}x
                      </span>
                    </div>
                  ))}

                  {/* Special Notes from Customer */}
                  {order.notes && (
                    <div className="bg-amber-50 border border-amber-300 p-2 rounded-lg text-xs text-amber-950 font-bold">
                      📝 কাস্টমারের নোট: {order.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">
                  {/* Status Progression */}
                  {order.status === 'new' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Flame className="w-4 h-4" />
                      রান্না শুরু করুন (Start Cooking)
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      রান্না প্রস্তুত (Mark Ready)
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'served')}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      পরিবেশন সম্পন্ন (Mark Served)
                    </button>
                  )}

                  {/* KOT Print Button */}
                  <button
                    onClick={() => triggerPrint(order)}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-yellow-300" />
                    কিচেন কপি প্রিন্ট (KOT)
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Staff Stock Quantity Add Modal (NO PRICE / NO COST) */}
      {isStockModalOpen && selectedIng && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 shadow-2xl space-y-4 text-neutral-900">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-bold text-sm">
                স্টক যোগ: {selectedIng.name_bn || selectedIng.name}
              </h3>
              <button onClick={() => setIsStockModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-neutral-500">
                বর্তমান কিচেন স্টক: <strong className="text-neutral-900">{selectedIng.current_stock} {selectedIng.unit}</strong>
              </p>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  নতুন আসা পরিমাণ লিখুন ({selectedIng.unit}):
                </label>
                <input
                  type="number"
                  placeholder={`যেমন: 50 বা 500`}
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-base"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="flex-1 py-2 border rounded-xl text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleAddStockQuantity}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print element */}
      <div className="hidden">
        {selectedOrderForPrint && (
          <KitchenReceipt ref={printRef} order={selectedOrderForPrint} />
        )}
      </div>
    </div>
  )
}
