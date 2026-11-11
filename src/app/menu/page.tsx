'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MenuItem, Category, RestaurantTable, Order, RestaurantSettings } from '@/types'
import { useReactToPrint } from 'react-to-print'
import { CustomerReceipt } from '@/components/receipts/CustomerReceipt'
import { toast } from 'sonner'
import {
  ShoppingBag,
  Plus,
  Minus,
  Utensils,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react'

export default function CustomerMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isCounterStaff, setIsCounterStaff] = useState<boolean>(false)

  // Cart state
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([])
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Success order for receipt printing & whatsapp
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurant_name: 'Pom Pom',
    address: 'Jhenaidah',
    phone: '',
    whatsapp: '',
    tax_rate: '0',
    currency_symbol: '৳',
  })

  const receiptRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  })

  useEffect(() => {
    // Check if staff/admin is taking order from counter
    const role = localStorage.getItem('pompom_user_role')
    if (role === 'admin' || role === 'kitchen') {
      setIsCounterStaff(true)
    }

    // Check browser online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    fetchData()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [catsRes, itemsRes, tablesRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*, category:categories(*)').order('sort_order'),
        supabase.from('restaurant_tables').select('*').order('table_number'),
        supabase.from('settings').select('*'),
      ])

      if (catsRes.data) {
        setCategories(catsRes.data)
        localStorage.setItem('pompom_cached_categories', JSON.stringify(catsRes.data))
      }
      if (itemsRes.data) {
        setMenuItems(itemsRes.data)
        localStorage.setItem('pompom_cached_menu_items', JSON.stringify(itemsRes.data))
      }
      if (tablesRes.data) {
        setTables(tablesRes.data)
        if (tablesRes.data.length > 0) setSelectedTableId(tablesRes.data[0].id)
        localStorage.setItem('pompom_cached_tables', JSON.stringify(tablesRes.data))
      }
      if (settingsRes.data) {
        const settingsMap: Record<string, string> = {}
        settingsRes.data.forEach((s) => {
          settingsMap[s.key] = s.value
        })
        const updated = {
          restaurant_name: settingsMap.restaurant_name || 'Pom Pom',
          address: settingsMap.address || 'Jhenaidah',
          phone: settingsMap.phone || '',
          whatsapp: settingsMap.whatsapp || '',
          currency_symbol: settingsMap.currency_symbol || '৳',
          tax_rate: settingsMap.tax_rate || '0',
        }
        setSettings(updated)
        localStorage.setItem('pompom_cached_settings', JSON.stringify(updated))
      }
    } catch (err) {
      console.warn('Network error, attempting offline cache recovery...', err)
      const cachedCats = localStorage.getItem('pompom_cached_categories')
      const cachedItems = localStorage.getItem('pompom_cached_menu_items')
      const cachedTables = localStorage.getItem('pompom_cached_tables')
      const cachedSettings = localStorage.getItem('pompom_cached_settings')

      if (cachedCats) setCategories(JSON.parse(cachedCats))
      if (cachedItems) setMenuItems(JSON.parse(cachedItems))
      if (cachedTables) {
        const parsed = JSON.parse(cachedTables)
        setTables(parsed)
        if (parsed.length > 0) setSelectedTableId(parsed[0].id)
      }
      if (cachedSettings) setSettings(JSON.parse(cachedSettings))
    } finally {
      setLoading(false)
    }
  }

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
    toast.success(`${item.name} কার্টে যোগ হয়েছে!`)
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter(Boolean) as { item: MenuItem; quantity: number }[]
    )
  }

  const subtotal = cart.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0)
  const total = subtotal

  // Formatted WhatsApp Order Link Generator
  function getWhatsAppUrl(order: Order) {
    const rawNumber = settings.whatsapp || '8801700000000'
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '')

    const itemsText = order.order_items
      ?.map((it) => `• ${it.item_name} x ${it.quantity} = ৳${it.subtotal}`)
      .join('\n')

    const message = `🍔 *নতুন অনলাইন অর্ডার - POM POM Jhenaidah*
--------------------------------
🧾 *টোকেন:* #${order.id.slice(0, 8).toUpperCase()}
👤 *কাস্টমার:* ${order.customer_name || 'Guest'}
📱 *ফোন:* ${order.customer_phone || 'N/A'}
🍽️ *অর্ডার ধরণ:* ${
      order.order_type === 'dine_in'
        ? `টেবিল #${order.table?.table_number || 'N/A'}`
        : 'পার্সেল / টেকঅ্যাওয়ে'
    }
--------------------------------
📋 *অর্ডারকৃত খাবার:*
${itemsText}
--------------------------------
💰 *সর্বমোট বিল:* ৳ ${order.total}
📝 *স্পেশাল নোট:* ${order.notes || 'কোনো নোট নেই'}
⏰ *সময়:* ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
  }

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      toast.error('দয়া করে কার্টে খাবার যোগ করুন')
      return
    }

    if (orderType === 'dine_in' && !selectedTableId) {
      toast.error('দয়া করে একটি টেবিল সিলেক্ট করুন')
      return
    }

    setIsSubmitting(true)

    const orderItems = cart.map((c) => ({
      menu_item_id: c.item.id,
      item_name: c.item.name,
      quantity: c.quantity,
      unit_price: c.item.price,
      subtotal: c.item.price * c.quantity,
    }))

    try {
      // 1. Create order in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: orderType === 'dine_in' ? selectedTableId : null,
          customer_name: customerName.trim() || 'অনলাইন কাস্টমার',
          customer_phone: customerPhone.trim() || null,
          order_type: orderType,
          status: 'new',
          notes: notes.trim() || null,
          subtotal: subtotal,
          discount: 0,
          total: total,
        })
        .select('*, table:restaurant_tables(*)')
        .single()

      if (orderError) throw orderError

      // 2. Insert items
      const itemsToInsert = orderItems.map((item) => ({
        ...item,
        order_id: orderData.id,
      }))
      await supabase.from('order_items').insert(itemsToInsert)

      // 3. Stock deduction based on recipe
      for (const cartItem of cart) {
        const { data: recipes } = await supabase
          .from('recipes')
          .select('ingredient_id, quantity_gm')
          .eq('menu_item_id', cartItem.item.id)

        if (recipes && recipes.length > 0) {
          for (const recipe of recipes) {
            const deduct = recipe.quantity_gm * cartItem.quantity
            const { data: ing } = await supabase
              .from('ingredients')
              .select('current_stock')
              .eq('id', recipe.ingredient_id)
              .single()

            if (ing) {
              const newStock = Math.max(0, Number(ing.current_stock) - deduct)
              await supabase
                .from('ingredients')
                .update({ current_stock: newStock })
                .eq('id', recipe.ingredient_id)
            }
          }
        }
      }

      const fullOrder: Order = {
        ...orderData,
        order_items: itemsToInsert,
      }

      setPlacedOrder(fullOrder)
      setCart([])
      toast.success('অর্ডার সফল হয়েছে! আপনার হোয়াটসঅ্যাপেও বার্তা পাঠানো হচ্ছে...')

      if (settings.whatsapp) {
        window.open(getWhatsAppUrl(fullOrder), '_blank')
      }
    } catch (err: unknown) {
      console.warn('Online sync failed, saving in offline fallback...', err)

      const offlineId = 'OFF-' + Date.now().toString(36).toUpperCase()
      const selectedTable = tables.find((t) => t.id === selectedTableId)
      const offlineOrder: Order = {
        id: offlineId,
        table_id: selectedTableId,
        customer_name: customerName.trim() || 'অফলাইন কাস্টমার',
        customer_phone: customerPhone.trim() || null,
        order_type: orderType,
        status: 'new',
        notes: notes.trim() || null,
        subtotal: subtotal,
        discount: 0,
        total: total,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        table: selectedTable,
        order_items: orderItems,
      }

      const existingOffline = JSON.parse(localStorage.getItem('pompom_offline_orders') || '[]')
      existingOffline.push(offlineOrder)
      localStorage.setItem('pompom_offline_orders', JSON.stringify(existingOffline))

      setPlacedOrder(offlineOrder)
      setCart([])
      toast.success('⚡ অফলাইন মোডে সংরক্ষিত হয়েছে!')

      if (settings.whatsapp) {
        window.open(getWhatsAppUrl(offlineOrder), '_blank')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Top Banner with Online/Offline Status */}
      <div className="rounded-xl bg-gradient-to-r from-[#CC0000] to-red-800 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-full h-14 w-14 flex items-center justify-center border-2 border-[#FFD700]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Pom Pom" className="h-9 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#FFD700]">POM POM MENU</h1>
            <p className="text-xs text-yellow-100">ঝিনাইদহ • আপনার পছন্দের খাবার অর্ডার করুন</p>
          </div>
        </div>

        {/* Live Network Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>অনলাইন মোড</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-950/80 text-amber-300 border border-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm animate-pulse">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>অফলাইন মোড</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Menu Items (Left) + Order Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Menu Items */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === 'all'
                  ? 'bg-[#CC0000] text-white shadow'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              🍔 সব আইটেম (All)
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory === cat.id
                    ? 'bg-[#CC0000] text-white shadow'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {cat.icon || '🍽️'} {cat.name_bn || cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items List */}
          {loading ? (
            <div className="p-8 text-center text-neutral-500">মেনু লোড হচ্ছে...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 text-neutral-500">
              <Utensils className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <p className="font-semibold">এই ক্যাটাগরিতে এখনো কোনো আইটেম যোগ করা হয়নি</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="h-32 bg-amber-50/60 relative flex items-center justify-center border-b border-neutral-100 overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Utensils className="w-8 h-8 mx-auto text-[#CC0000]/60 mb-1" />
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          Pom Pom Fresh
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-[#CC0000] text-white font-black text-xs px-2 py-0.5 rounded shadow">
                      {settings.currency_symbol} {item.price}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm">{item.name}</h3>
                      {item.name_bn && (
                        <p className="text-xs text-neutral-500">{item.name_bn}</p>
                      )}
                      {item.description && (
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#CC0000] hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      কার্টে যোগ করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Cart & Checkout */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border-2 border-red-200 p-5 shadow-lg space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#CC0000]" />
                <h2 className="font-black text-base text-neutral-900">অর্ডার কার্ট ({cart.length})</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  সব মুছুন
                </button>
              )}
            </div>

            {/* Order Type Toggle: Dine In or Takeaway */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-[#CC0000] text-white shadow'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                🍽️ ডাইন-ইন (টেবিল)
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-[#CC0000] text-white shadow'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                🥡 পার্সেল (Takeaway)
              </button>
            </div>

            {/* Table Selection for Dine-in */}
            {orderType === 'dine_in' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">টেবিল নম্বর:</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      টেবিল #{t.table_number} ({t.seats} সিট) — {t.status === 'occupied' ? 'বসা আছে' : 'ফাঁকা'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold text-neutral-700">আপনার নাম:</label>
                <input
                  type="text"
                  placeholder="যেমন: মোস্তাফিজুর রহমান"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-0.5 p-2 border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">মোবাইল নম্বর:</label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full mt-0.5 p-2 border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700">স্পেশাল নোট (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="যেমন: ঝাল বেশি দিয়েন, সস আলাদা দিয়েন"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-0.5 p-2 border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  কার্ট বর্তমানে খালি। মেনু থেকে খাবার সিলেক্ট করুন।
                </div>
              ) : (
                cart.map(({ item, quantity }) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-neutral-800">{item.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {settings.currency_symbol} {item.price} × {quantity} ={' '}
                        <span className="font-semibold text-neutral-800">
                          {settings.currency_symbol} {item.price * quantity}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-md">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 bg-white text-neutral-700 rounded flex items-center justify-center hover:bg-neutral-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-bold">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 bg-white text-neutral-700 rounded flex items-center justify-center hover:bg-neutral-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary */}
            <div className="pt-3 border-t border-neutral-200 space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm text-[#CC0000]">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span>{settings.currency_symbol} {total}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || cart.length === 0}
              className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                cart.length === 0 || isSubmitting
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#CC0000] hover:bg-red-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <span>অর্ডার প্রসেস হচ্ছে...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>অর্ডার কনফার্ম করুন ({settings.currency_symbol} {total})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Order Placed Success Modal with WhatsApp Action & Print */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-black text-neutral-900">অর্ডার সফলভাবে গ্রহণ করা হয়েছে!</h2>
              <p className="text-xs text-neutral-500 mt-1">
                টোকেন নম্বর: <span className="font-bold text-[#CC0000]">#{placedOrder.id.slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                {placedOrder.order_type === 'dine_in'
                  ? `টেবিল #${placedOrder.table?.table_number || ''}`
                  : 'পার্সেল / টেকঅ্যাওয়ে'}
              </p>
            </div>

            {/* WhatsApp Notification Button */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>হোয়াটসঅ্যাপে অর্ডার নিশ্চিত করুন:</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                রেস্তোরাঁর হোয়াটসঅ্যাপে অর্ডারের বিস্তারিত বার্তা পাঠাতে নিচের বাটনে ক্লিক করুন:
              </p>
              <a
                href={getWhatsAppUrl(placedOrder)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
              >
                <Smartphone className="w-4 h-4" />
                হোয়াটসঅ্যাপে বিস্তারিত পাঠান (Send via WhatsApp)
              </a>
            </div>

            {/* Action Buttons: Print button ONLY for counter staff! Hidden for normal online customers */}
            <div className="pt-2 flex flex-col gap-2">
              {isCounterStaff && (
                <button
                  onClick={() => handlePrint()}
                  className="w-full py-2 px-4 rounded-xl bg-[#CC0000] hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Printer className="w-4 h-4" />
                  কাউন্টার কপি প্রিন্ট করুন (Receipt)
                </button>
              )}

              <button
                onClick={() => setPlacedOrder(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs shadow-sm"
              >
                নতুন অর্ডার করুন
              </button>
            </div>

            {/* Hidden printable receipt for counter staff */}
            <div className="hidden">
              <CustomerReceipt ref={receiptRef} order={placedOrder} settings={settings} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
