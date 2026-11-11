'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, Expense, Ingredient, MenuItem } from '@/types'
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Utensils,
  Wallet,
  Users,
  Flame,
  ArrowUpRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const [ordersRes, expensesRes, ingsRes, menuRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('ingredients').select('*'),
        supabase.from('menu_items').select('*'),
      ])

      if (ordersRes.data) setOrders(ordersRes.data)
      if (expensesRes.data) setExpenses(expensesRes.data)
      if (ingsRes.data) setIngredients(ingsRes.data)
      if (menuRes.data) setMenuItems(menuRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr))
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const netProfit = totalSales - totalExpenses

  // Stock alert calculation: ingredients >= 80% used
  const lowStockIngredients = ingredients.filter((ing) => {
    if (ing.total_purchased > 0) {
      const used = ing.total_purchased - ing.current_stock
      const percentUsed = (used / ing.total_purchased) * 100
      return percentUsed >= 80 || ing.current_stock <= ing.min_stock_alert
    }
    return ing.current_stock <= 50
  })

  // Chart data: Sales for last 7 days
  const last7Days: { name: string; sales: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' })
    const daySales = orders
      .filter((o) => o.created_at.startsWith(dateStr))
      .reduce((sum, o) => sum + Number(o.total || 0), 0)

    last7Days.push({ name: dayName, sales: daySales })
  }

  // Expense breakdown data for Pie Chart
  const expenseByType: Record<string, number> = {}
  expenses.forEach((e) => {
    const type = e.type || 'other'
    expenseByType[type] = (expenseByType[type] || 0) + Number(e.amount || 0)
  })

  const pieColors = ['#CC0000', '#FFD700', '#2563EB', '#10B981', '#8B5CF6', '#F59E0B']
  const expensePieData = Object.keys(expenseByType).map((key) => ({
    name:
      key === 'salary'
        ? 'বেতন'
        : key === 'electricity'
        ? 'বিদ্যুৎ বিল'
        : key === 'delivery'
        ? 'ডেলিভারি খরচ'
        : key === 'rent'
        ? 'দোকান ভাড়া'
        : key === 'ingredient'
        ? 'কাঁচামাল'
        : 'অন্যান্য',
    value: expenseByType[key],
  }))

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#CC0000] via-red-800 to-[#FFD700] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-2">
            <Flame className="w-3.5 h-3.5 text-yellow-300" />
            <span>POM POM • ঝিনাইদহ অ্যাডমিন ড্যাশবোর্ড</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            বিক্রি, স্টক ও প্রফিট ওভারভিউ
          </h1>
          <p className="text-xs text-yellow-100 mt-1">
            দৈনিক বিক্রি, মাসিক লাভ-ক্ষতি ও স্টক অ্যালার্টের পূর্ণাঙ্গ রিয়েল-টাইম হিসাব।
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center">
          <p className="text-xs text-yellow-200">আজকের মোট অর্ডার</p>
          <p className="text-2xl font-black text-white">{todayOrders.length} টি</p>
        </div>
      </div>

      {/* 80% Stock Alert Banner if any ingredients are low */}
      {lowStockIngredients.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse">
          <div className="flex items-center gap-2 text-red-800 font-black text-base">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <span>⚠️ স্টক অ্যালার্ট: নিচের কাঁচামালগুলোর ৮০% বা তার বেশি ব্যবহার হয়ে গেছে!</span>
          </div>
          <p className="text-xs text-red-700 font-medium">
            দয়া করে দ্রুত নতুন স্টক ক্রয়ের এন্ট্রি দিন। স্টক শেষ হয়ে গেলে সম্পর্কিত মেনু আইটেম প্রস্তুত করা যাবে না।
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {lowStockIngredients.map((ing) => (
              <div
                key={ing.id}
                className="bg-white p-3 rounded-xl border border-red-300 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-neutral-800">{ing.name_bn || ing.name}</p>
                  <p className="text-xs text-red-600 font-bold">
                    অবশিষ্ট: {ing.current_stock} {ing.unit}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase bg-red-100 text-red-800 px-2 py-1 rounded">
                  ৮০%+ শেষ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
            <span>আজকের মোট বিক্রি</span>
            <span className="p-2 bg-red-100 text-[#CC0000] rounded-lg">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-neutral-900">৳ {todaySales}</div>
          <p className="text-[11px] text-neutral-400">অর্ডার সংখ্যা: {todayOrders.length}</p>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
            <span>সর্বমোট বিক্রি (Sales)</span>
            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-neutral-900">৳ {totalSales}</div>
          <p className="text-[11px] text-neutral-400">সর্বমোট অর্ডার: {orders.length}</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
            <span>মোট খরচ (Expenses)</span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700">৳ {totalExpenses}</div>
          <p className="text-[11px] text-neutral-400">বেতন, বিদ্যুৎ ও অন্যান্য খরচ</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold">
            <span>নিট লাভ (Net Profit)</span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-2xl font-black ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            ৳ {netProfit}
          </div>
          <p className="text-[11px] text-neutral-400">বিক্রি - মোট যাবতীয় খরচ</p>
        </div>
      </div>

      {/* Charts Row: Weekly Sales Bar Chart + Expense Breakdown Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Sales */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#CC0000]" />
              গত ৭ দিনের বিক্রির ট্রেন্ড (Sales Trend)
            </h3>
            <span className="text-xs text-neutral-400">টাকায় (৳)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <XAxis dataKey="name" fontSize={11} stroke="#888888" />
                <YAxis fontSize={11} stroke="#888888" />
                <Tooltip
                  formatter={(value: any) => [`৳ ${value}`, 'বিক্রি']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="sales" fill="#CC0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-amber-600" />
            খরচের খাতসমূহ (Expense Breakdown)
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {expensePieData.length === 0 ? (
              <p className="text-xs text-neutral-400">এখনো কোনো খরচের এন্ট্রি দেওয়া হয়নি</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`৳ ${value}`, 'খরচ']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-2">
          <Receipt className="w-4 h-4 text-neutral-600" />
          সর্বশেষ অর্ডারসমূহ
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
              <tr>
                <th className="p-3">অর্ডার টোকেন</th>
                <th className="p-3">ধরণ</th>
                <th className="p-3">কাস্টমার</th>
                <th className="p-3">স্ট্যাটাস</th>
                <th className="p-3">মোট টাকা</th>
                <th className="p-3">সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.slice(0, 8).map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-mono font-bold text-neutral-800">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="p-3 font-semibold">
                    {order.order_type === 'dine_in'
                      ? `টেবিল #${order.table_id || 'N/A'}`
                      : 'পার্সেল'}
                  </td>
                  <td className="p-3 text-neutral-600">{order.customer_name || 'গেস্ট'}</td>
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
                  <td className="p-3 font-black text-neutral-900">৳ {order.total}</td>
                  <td className="p-3 text-neutral-400">
                    {new Date(order.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
