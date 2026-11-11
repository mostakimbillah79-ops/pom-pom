'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Ingredient } from '@/types'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  AlertTriangle,
  Truck,
  Trash2,
  Edit,
  Sparkles,
  CheckCircle,
  X,
  Info,
} from 'lucide-react'

export default function StockManagementPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Add / Edit Ingredient Modal
  const [isIngModalOpen, setIsIngModalOpen] = useState<boolean>(false)
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null)
  const [ingName, setIngName] = useState<string>('')
  const [ingNameBn, setIngNameBn] = useState<string>('')
  const [ingUnit, setIngUnit] = useState<string>('gm')
  const [ingCurrentStock, setIngCurrentStock] = useState<string>('0')
  const [ingCostPerUnit, setIngCostPerUnit] = useState<string>('0')
  const [ingMinAlert, setIngMinAlert] = useState<string>('50')

  // Purchase Entry Modal (Stock Inward + Delivery Cost)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false)
  const [selectedIngId, setSelectedIngId] = useState<string>('')
  const [purchaseQty, setPurchaseQty] = useState<string>('0')
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState<string>('0')
  const [purchaseDeliveryCost, setPurchaseDeliveryCost] = useState<string>('0')
  const [purchaseSupplier, setPurchaseSupplier] = useState<string>('')

  // Quick Inline Add new raw material from within purchase modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false)
  const [quickName, setQuickName] = useState<string>('')
  const [quickUnit, setQuickUnit] = useState<string>('gm')
  const [quickCost, setQuickCost] = useState<string>('0')

  useEffect(() => {
    fetchIngredients()
  }, [])

  async function fetchIngredients() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('ingredients').select('*').order('name')
      if (error) throw error
      if (data) setIngredients(data)
    } catch (err: unknown) {
      console.error(err)
      toast.error('স্টক তথ্য লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  function openIngModal(ing?: Ingredient) {
    if (ing) {
      setEditingIng(ing)
      setIngName(ing.name)
      setIngNameBn(ing.name_bn || '')
      setIngUnit(ing.unit || 'gm')
      setIngCurrentStock(String(ing.current_stock || 0))
      setIngCostPerUnit(String(ing.cost_per_unit || 0))
      setIngMinAlert(String(ing.min_stock_alert || 50))
    } else {
      setEditingIng(null)
      setIngName('')
      setIngNameBn('')
      setIngUnit('gm')
      setIngCurrentStock('0')
      setIngCostPerUnit('0')
      setIngMinAlert('50')
    }
    setIsIngModalOpen(true)
  }

  async function handleSaveIngredient() {
    if (!ingName.trim()) {
      toast.error('কাঁচামালের নাম আবশ্যক')
      return
    }

    try {
      const qty = Number(ingCurrentStock) || 0
      const payload = {
        name: ingName.trim(),
        name_bn: ingNameBn.trim() || null,
        unit: ingUnit,
        current_stock: qty,
        cost_per_unit: Number(ingCostPerUnit) || 0,
        min_stock_alert: Number(ingMinAlert) || 50,
      }

      if (editingIng) {
        const { error } = await supabase
          .from('ingredients')
          .update(payload)
          .eq('id', editingIng.id)
        if (error) throw error
        toast.success('কাঁচামাল আপডেট সম্পন্ন হয়েছে!')
      } else {
        const { error } = await supabase
          .from('ingredients')
          .insert({ ...payload, total_purchased: qty })
        if (error) throw error
        toast.success('নতুন কাঁচামাল স্টকে যুক্ত হয়েছে!')
      }

      setIsIngModalOpen(false)
      fetchIngredients()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('সংরক্ষণ ব্যর্থ: ' + message)
    }
  }

  async function handleDeleteIngredient(id: string) {
    if (!confirm('আপনি কি নিশ্চিত এই কাঁচামালটি স্টক থেকে মুছতে চান?')) return
    try {
      const { error } = await supabase.from('ingredients').delete().eq('id', id)
      if (error) throw error
      toast.success('কাঁচামাল সফলভাবে মুছে ফেলা হয়েছে')
      fetchIngredients()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('মুছতে সমস্যা: ' + message)
    }
  }

  async function handleQuickAddIngredient() {
    if (!quickName.trim()) {
      toast.error('কাঁচামালের নাম লিখুন')
      return
    }

    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          name: quickName.trim(),
          name_bn: quickName.trim(),
          unit: quickUnit,
          current_stock: 0,
          total_purchased: 0,
          cost_per_unit: Number(quickCost) || 0,
          min_stock_alert: 50,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`"${quickName}" সফলভাবে নতুন কাঁচামাল হিসেবে যোগ হয়েছে!`)
      await fetchIngredients()
      setSelectedIngId(data.id)
      setIsQuickAddOpen(false)
      setQuickName('')
      setQuickCost('0')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('দ্রুত কাঁচামাল যোগ ব্যর্থ: ' + message)
    }
  }

  async function handlePurchaseEntry() {
    if (!selectedIngId || Number(purchaseQty) <= 0) {
      toast.error('দয়া করে কাঁচামাল ও সঠিক পরিমাণ নির্বাচন করুন')
      return
    }

    try {
      const qty = Number(purchaseQty)
      const unitPrice = Number(purchaseUnitPrice)
      const delivery = Number(purchaseDeliveryCost) || 0

      // 1. Record stock purchase
      const { error: pError } = await supabase.from('stock_purchases').insert({
        ingredient_id: selectedIngId,
        quantity: qty,
        unit_price: unitPrice,
        total_cost: qty * unitPrice,
        delivery_cost: delivery,
        supplier_name: purchaseSupplier.trim() || null,
      })

      if (pError) throw pError

      // 2. Also record delivery cost in expenses table
      if (delivery > 0) {
        await supabase.from('expenses').insert({
          type: 'delivery',
          description: `কাঁচামাল আনার ডেলিভারি খরচ (${purchaseSupplier || 'সাপ্লায়ার'})`,
          amount: delivery,
          expense_date: new Date().toISOString().split('T')[0],
        })
      }

      // 3. Update current_stock and cost_per_unit in ingredients table
      const ing = ingredients.find((i) => i.id === selectedIngId)
      if (ing) {
        const newStock = Number(ing.current_stock || 0) + qty
        const newTotal = Number(ing.total_purchased || 0) + qty

        await supabase
          .from('ingredients')
          .update({
            current_stock: newStock,
            total_purchased: newTotal,
            cost_per_unit: unitPrice > 0 ? unitPrice : ing.cost_per_unit,
          })
          .eq('id', selectedIngId)
      }

      toast.success('স্টক ও খরচ এন্ট্রি সফল হয়েছে!')
      setIsPurchaseModalOpen(false)
      setPurchaseQty('0')
      setPurchaseUnitPrice('0')
      setPurchaseDeliveryCost('0')
      fetchIngredients()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('এন্ট্রি ব্যর্থ হয়েছে: ' + message)
    }
  }

  // Stock items with >= 80% usage
  const alertIngredients = ingredients.filter((ing) => {
    if (ing.total_purchased > 0) {
      const usedPercent = ((ing.total_purchased - ing.current_stock) / ing.total_purchased) * 100
      return usedPercent >= 80 || ing.current_stock <= ing.min_stock_alert
    }
    return ing.current_stock <= 50
  })

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#CC0000]" />
            কাঁচামাল স্টক ও ক্রয় ব্যবস্থাপনা (৮০% অ্যালার্ট)
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            আপনার রেস্তোরাঁর যেকোনো কাঁচামাল (মাংস, মশলা, তেল, পনির, সস, বক্স ইত্যাদি) ইচ্ছামতো যোগ করুন এবং খরচ ট্র্যাক করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            + মাল ক্রয় ও ডেলিভারি খরচ
          </button>
          <button
            onClick={() => openIngModal()}
            className="px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            + নতুন কাঁচামাল যোগ করুন
          </button>
        </div>
      </div>

      {/* Helper Tip Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          💡 <strong>টিপস:</strong> কাঁচামাল কোনো নির্দিষ্ট বা ফিক্সড তালিকা নয়! আপনি <strong>&quot;+ নতুন কাঁচামাল যোগ করুন&quot;</strong> বাটনে ক্লিক করে যেকোনো কাঁচামাল (যেমন: চিজ স্লাইস, পেঁয়াজ, লেটুস, চিলি সস, মেয়োনিজ, ফুড বক্স) নিজের ইচ্ছামতো নাম, পরিমাপের একক (গ্রাম/পিস/কেজি) ও ক্রয়মূল্য দিয়ে আনলিমিটেড যুক্ত করতে পারবেন।
        </span>
      </div>

      {/* 80% Red Alert Banner */}
      {alertIngredients.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-black text-sm md:text-base">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <span>⚠️ সতর্কবার্তা: নিচের কাঁচামালগুলোর ৮০% বা তার বেশি ব্যবহৃত হয়ে গেছে!</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alertIngredients.map((ing) => {
              const used = ing.total_purchased - ing.current_stock
              const percentUsed =
                ing.total_purchased > 0 ? Math.round((used / ing.total_purchased) * 100) : 100
              return (
                <div
                  key={ing.id}
                  className="bg-white p-3.5 rounded-xl border-2 border-red-300 shadow-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-900">
                      {ing.name_bn || ing.name}
                    </span>
                    <span className="bg-red-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded">
                      {percentUsed}% খরচ
                    </span>
                  </div>
                  <p className="text-xs text-red-600 font-bold">
                    অবশিষ্ট আছে: {ing.current_stock} {ing.unit}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ingredients List Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
              <tr>
                <th className="p-3">কাঁচামাল নাম</th>
                <th className="p-3">একক (Unit)</th>
                <th className="p-3">বর্তমান স্টক</th>
                <th className="p-3">মোট ক্রয়</th>
                <th className="p-3">ব্যবহার শতাংশ (%)</th>
                <th className="p-3">একক দর (Cost)</th>
                <th className="p-3">স্ট্যাটাস</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400">
                    বর্তমানে কোনো কাঁচামাল নেই। &quot;+ নতুন কাঁচামাল যোগ করুন&quot; বাটনে ক্লিক করে যুক্ত করুন।
                  </td>
                </tr>
              ) : (
                ingredients.map((ing) => {
                  const used = Number(ing.total_purchased || 0) - Number(ing.current_stock || 0)
                  const percentUsed =
                    ing.total_purchased > 0
                      ? Math.min(100, Math.round((used / Number(ing.total_purchased)) * 100))
                      : 0
                  const isLow = percentUsed >= 80 || Number(ing.current_stock) <= Number(ing.min_stock_alert)

                  return (
                    <tr key={ing.id} className={isLow ? 'bg-red-50/40' : 'hover:bg-neutral-50'}>
                      <td className="p-3 font-bold text-neutral-900">
                        {ing.name_bn || ing.name}
                        {ing.name_bn && (
                          <span className="block text-[10px] text-neutral-400 font-normal">
                            {ing.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-neutral-600">{ing.unit}</td>
                      <td className="p-3 font-black text-sm text-neutral-900">
                        {ing.current_stock} {ing.unit}
                      </td>
                      <td className="p-3 text-neutral-600">
                        {ing.total_purchased || ing.current_stock} {ing.unit}
                      </td>
                      <td className="p-3 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isLow ? 'bg-red-600' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-neutral-700">
                            {percentUsed}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-neutral-700">
                        ৳ {ing.cost_per_unit || 0} / {ing.unit}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isLow
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLow ? '🔴 ৮০%+ শেষ' : 'পর্যাপ্ত'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openIngModal(ing)}
                            title="এডিট করুন"
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ing.id)}
                            title="মুছে ফেলুন"
                            className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Ingredient Modal */}
      {isIngModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h2 className="font-black text-base text-neutral-900">
                {editingIng ? 'কাঁচামাল এডিট করুন' : 'নতুন কাঁচামাল যোগ করুন'}
              </h2>
              <button onClick={() => setIsIngModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700">কাঁচামালের নাম (বাংলায়):</label>
                <input
                  type="text"
                  placeholder="যেমন: টমেটো সস, চিজ স্লাইস, পেঁয়াজ"
                  value={ingNameBn}
                  onChange={(e) => {
                    setIngNameBn(e.target.value)
                    if (!ingName) setIngName(e.target.value)
                  }}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">কাঁচামালের নাম (English - ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="e.g. Cheese Slice, Onion, Bun"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700">পরিমাপের একক:</label>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="gm">গ্রাম (gm)</option>
                    <option value="kg">কেজি (kg)</option>
                    <option value="pcs">পিস (pcs)</option>
                    <option value="ml">মিলি (ml)</option>
                    <option value="packet">প্যাকেট (packet)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700">বর্তমান স্টক পরিমাণ:</label>
                  <input
                    type="number"
                    value={ingCurrentStock}
                    onChange={(e) => setIngCurrentStock(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700">
                    প্রতি এককের দাম (টাকা ৳):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="যেমন: 0.50 বা 15"
                    value={ingCostPerUnit}
                    onChange={(e) => setIngCostPerUnit(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    (যেমন: প্রতি গ্রাম বা পিসের দাম)
                  </span>
                </div>
                <div>
                  <label className="font-bold text-neutral-700">মিনিমাম অ্যালার্ট সীমা:</label>
                  <input
                    type="number"
                    value={ingMinAlert}
                    onChange={(e) => setIngMinAlert(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => setIsIngModalOpen(false)}
                className="flex-1 py-2 rounded-lg border text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveIngredient}
                className="flex-1 py-2 rounded-lg bg-[#CC0000] text-white font-bold text-xs shadow"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Inward & Delivery Cost Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h2 className="font-black text-base text-neutral-900 flex items-center gap-1.5">
                <Truck className="w-5 h-5 text-emerald-600" />
                মাল ক্রয় ও ডেলিভারি খরচ এন্ট্রি
              </h2>
              <button onClick={() => setIsPurchaseModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Quick Add toggle banner */}
            <div className="flex items-center justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
              <span className="text-amber-900 font-semibold">কাঁচামালটি তালিকায় নেই?</span>
              <button
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] shadow-sm"
              >
                {isQuickAddOpen ? 'লিস্টে ফিরে যান' : '+ নতুন কাঁচামাল তৈরি করুন'}
              </button>
            </div>

            {/* Quick Add Form inside Purchase Modal */}
            {isQuickAddOpen ? (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
                <h4 className="font-bold text-neutral-800">নতুন কাঁচামালের নাম ও একক দিন:</h4>
                <input
                  type="text"
                  placeholder="যেমন: চিজ, পেঁয়াজ, সস, বাটার"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={quickUnit}
                    onChange={(e) => setQuickUnit(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="gm">গ্রাম (gm)</option>
                    <option value="pcs">পিস (pcs)</option>
                    <option value="kg">কেজি (kg)</option>
                    <option value="ml">মিলি (ml)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="দর (প্রতি ইউনিট)"
                    value={quickCost}
                    onChange={(e) => setQuickCost(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleQuickAddIngredient}
                  className="w-full py-1.5 bg-[#CC0000] text-white font-bold rounded-lg shadow-sm"
                >
                  তৈরি করে তালিকায় যোগ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-700">কোন কাঁচামাল ক্রয় করেছেন?</label>
                  <select
                    value={selectedIngId}
                    onChange={(e) => {
                      setSelectedIngId(e.target.value)
                      const ing = ingredients.find((i) => i.id === e.target.value)
                      if (ing && ing.cost_per_unit) {
                        setPurchaseUnitPrice(String(ing.cost_per_unit))
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="">কাঁচামাল সিলেক্ট করুন</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name_bn || i.name} ({i.unit}) — বর্তমান স্টক: {i.current_stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700">ক্রয়ের পরিমাণ:</label>
                    <input
                      type="number"
                      placeholder="যেমন: 500 বা 1000"
                      value={purchaseQty}
                      onChange={(e) => setPurchaseQty(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700">একক দর (প্রতি ইউনিট ৳):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseUnitPrice}
                      onChange={(e) => setPurchaseUnitPrice(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="font-bold text-amber-900">
                    মাল আনার ডেলিভারি / যাতায়াত খরচ (টাকা ৳):
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ৫০ বা ১০০"
                    value={purchaseDeliveryCost}
                    onChange={(e) => setPurchaseDeliveryCost(e.target.value)}
                    className="w-full mt-1 p-2 border border-amber-300 rounded-lg focus:outline-none bg-white font-bold"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    * এই ডেলিভারি খরচটি স্বয়ংক্রিয়ভাবে মাসিক খরচে যুক্ত হবে
                  </span>
                </div>

                <div>
                  <label className="font-bold text-neutral-700">সাপ্লায়ার / দোকান নাম:</label>
                  <input
                    type="text"
                    placeholder="যেমন: ঝিনাইদহ বাজার, ঢাকা সাপ্লাই"
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="flex-1 py-2 rounded-lg border text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={handlePurchaseEntry}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
              >
                এন্ট্রি নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
