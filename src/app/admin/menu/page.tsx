'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MenuItem, Category, Ingredient, RecipeItem } from '@/types'
import { toast } from 'sonner'
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react'

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Item Form Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemName, setItemName] = useState<string>('')
  const [itemNameBn, setItemNameBn] = useState<string>('')
  const [itemCategory, setItemCategory] = useState<string>('')
  const [itemPrice, setItemPrice] = useState<string>('0')
  const [itemCostPrice, setItemCostPrice] = useState<string>('0')
  const [itemDescription, setItemDescription] = useState<string>('')
  const [itemImageUrl, setItemImageUrl] = useState<string>('')

  // Recipe Modal
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [currentRecipes, setCurrentRecipes] = useState<RecipeItem[]>([])
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('')
  const [ingredientQuantity, setIngredientQuantity] = useState<string>('0')

  // Quick Add new ingredient inside Recipe Modal
  const [isQuickIngOpen, setIsQuickIngOpen] = useState<boolean>(false)
  const [quickIngName, setQuickIngName] = useState<string>('')
  const [quickIngUnit, setQuickIngUnit] = useState<string>('gm')
  const [quickIngCost, setQuickIngCost] = useState<string>('0')

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false)
  const [newCatName, setNewCatName] = useState<string>('')
  const [newCatNameBn, setNewCatNameBn] = useState<string>('')
  const [newCatIcon, setNewCatIcon] = useState<string>('🍔')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [catsRes, itemsRes, ingsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase
          .from('menu_items')
          .select('*, category:categories(*), recipes(*, ingredient:ingredients(*))')
          .order('sort_order'),
        supabase.from('ingredients').select('*').order('name'),
      ])

      if (catsRes.data) setCategories(catsRes.data)
      if (itemsRes.data) setMenuItems(itemsRes.data)
      if (ingsRes.data) setIngredients(ingsRes.data)
    } catch (err: unknown) {
      console.error(err)
      toast.error('তথ্য লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  // Open Add/Edit Item
  function openItemModal(item?: MenuItem) {
    if (item) {
      setEditingItem(item)
      setItemName(item.name)
      setItemNameBn(item.name_bn || '')
      setItemCategory(item.category_id || '')
      setItemPrice(String(item.price))
      setItemCostPrice(String(item.cost_price || 0))
      setItemDescription(item.description || '')
      setItemImageUrl(item.image_url || '')
    } else {
      setEditingItem(null)
      setItemName('')
      setItemNameBn('')
      setItemCategory(categories[0]?.id || '')
      setItemPrice('0')
      setItemCostPrice('0')
      setItemDescription('')
      setItemImageUrl('')
    }
    setIsItemModalOpen(true)
  }

  async function handleSaveItem() {
    if (!itemName.trim()) {
      toast.error('আইটেমের নাম আবশ্যক')
      return
    }

    try {
      const payload = {
        name: itemName.trim(),
        name_bn: itemNameBn.trim() || null,
        category_id: itemCategory || null,
        price: Number(itemPrice) || 0,
        cost_price: Number(itemCostPrice) || 0,
        description: itemDescription.trim() || null,
        image_url: itemImageUrl.trim() || null,
      }

      if (editingItem) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id)
        if (error) throw error
        toast.success('মেনু আইটেম আপডেট হয়েছে!')
      } else {
        const { error } = await supabase.from('menu_items').insert(payload)
        if (error) throw error
        toast.success('নতুন মেনু আইটেম যোগ হয়েছে!')
      }

      setIsItemModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('সংরক্ষণ করতে সমস্যা: ' + message)
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('আপনি কি নিশ্চিত এই আইটেমটি মুছতে চান?')) return
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (error) throw error
      toast.success('আইটেম মুছে ফেলা হয়েছে')
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('মুছতে সমস্যা: ' + message)
    }
  }

  // Open Recipe Modal
  async function openRecipeModal(item: MenuItem) {
    setSelectedMenuItem(item)
    try {
      const { data } = await supabase
        .from('recipes')
        .select('*, ingredient:ingredients(*)')
        .eq('menu_item_id', item.id)

      if (data) setCurrentRecipes(data)
      setIsRecipeModalOpen(true)
    } catch (err) {
      console.error(err)
      toast.error('রেসিপি লোড হয়নি')
    }
  }

  // Quick Add new ingredient directly in recipe modal
  async function handleQuickAddIngredient() {
    if (!quickIngName.trim()) {
      toast.error('কাঁচামালের নাম লিখুন')
      return
    }

    try {
      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          name: quickIngName.trim(),
          name_bn: quickIngName.trim(),
          unit: quickIngUnit,
          current_stock: 0,
          total_purchased: 0,
          cost_per_unit: Number(quickIngCost) || 0,
          min_stock_alert: 50,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`"${quickIngName}" সফলভাবে তৈরি হয়েছে!`)
      // Refresh ingredients list
      const ingsRes = await supabase.from('ingredients').select('*').order('name')
      if (ingsRes.data) setIngredients(ingsRes.data)

      setSelectedIngredientId(data.id)
      setIsQuickIngOpen(false)
      setQuickIngName('')
      setQuickIngCost('0')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('কাঁচামাল যোগ ব্যর্থ: ' + message)
    }
  }

  // Add ingredient to recipe with gram/unit quantity
  async function handleAddRecipeIngredient() {
    if (!selectedMenuItem || !selectedIngredientId || Number(ingredientQuantity) <= 0) {
      toast.error('দয়া করে কাঁচামাল নির্বাচন করে সঠিক পরিমাণ (গ্রাম বা পিস) দিন')
      return
    }

    try {
      const ing = ingredients.find((i) => i.id === selectedIngredientId)
      const unit = ing?.unit || 'gm'

      const { error } = await supabase.from('recipes').upsert({
        menu_item_id: selectedMenuItem.id,
        ingredient_id: selectedIngredientId,
        quantity_gm: Number(ingredientQuantity),
        unit: unit,
      })

      if (error) throw error

      toast.success('রেসিপিতে কাঁচামাল যুক্ত হয়েছে!')

      // Refresh recipes for this item
      const { data } = await supabase
        .from('recipes')
        .select('*, ingredient:ingredients(*)')
        .eq('menu_item_id', selectedMenuItem.id)

      if (data) {
        setCurrentRecipes(data)

        // Calculate exact total production cost from all ingredients
        let calculatedCost = 0
        data.forEach((r) => {
          if (r.ingredient) {
            calculatedCost += Number(r.quantity_gm) * Number(r.ingredient.cost_per_unit || 0)
          }
        })

        const roundedCost = Math.round(calculatedCost * 100) / 100

        // Automatically update cost_price on menu item in database
        await supabase
          .from('menu_items')
          .update({ cost_price: roundedCost })
          .eq('id', selectedMenuItem.id)

        // Update local state
        setSelectedMenuItem((prev) => (prev ? { ...prev, cost_price: roundedCost } : prev))
        fetchData()
      }

      setIngredientQuantity('0')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('রেসিপি যোগ করতে সমস্যা: ' + message)
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!selectedMenuItem) return
    try {
      await supabase.from('recipes').delete().eq('id', recipeId)

      const { data } = await supabase
        .from('recipes')
        .select('*, ingredient:ingredients(*)')
        .eq('menu_item_id', selectedMenuItem.id)

      if (data) {
        setCurrentRecipes(data)

        let calculatedCost = 0
        data.forEach((r) => {
          if (r.ingredient) {
            calculatedCost += Number(r.quantity_gm) * Number(r.ingredient.cost_per_unit || 0)
          }
        })

        const roundedCost = Math.round(calculatedCost * 100) / 100
        await supabase
          .from('menu_items')
          .update({ cost_price: roundedCost })
          .eq('id', selectedMenuItem.id)

        setSelectedMenuItem((prev) => (prev ? { ...prev, cost_price: roundedCost } : prev))
        fetchData()
      }

      toast.success('রেসিপি উপাদান সরানো হয়েছে')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('মুছতে সমস্যা: ' + message)
    }
  }

  // Category Add
  async function handleSaveCategory() {
    if (!newCatName.trim()) return
    try {
      await supabase.from('categories').insert({
        name: newCatName.trim(),
        name_bn: newCatNameBn.trim() || null,
        icon: newCatIcon,
      })
      toast.success('নতুন ক্যাটাগরি তৈরি হয়েছে')
      setIsCatModalOpen(false)
      setNewCatName('')
      setNewCatNameBn('')
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('ক্যাটাগরি তৈরি ব্যর্থ: ' + message)
    }
  }

  // Total calculated cost of current recipes in modal
  const modalTotalCost = currentRecipes.reduce((sum, r) => {
    return sum + Number(r.quantity_gm) * Number(r.ingredient?.cost_per_unit || 0)
  }, 0)
  const modalRoundedCost = Math.round(modalTotalCost * 100) / 100
  const modalSellingPrice = Number(selectedMenuItem?.price || 0)
  const modalProfit = Math.round((modalSellingPrice - modalRoundedCost) * 100) / 100
  const modalProfitPercent =
    modalSellingPrice > 0 ? Math.round((modalProfit / modalSellingPrice) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-[#CC0000]" />
            মেনু ও রেসিপি কস্টিং ম্যানেজার
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            প্রতিটি খাবারের রেসিপিতে কত গ্রাম কোন কাঁচামাল লাগবে তা নির্ধারণ করুন এবং সিস্টেম স্বয়ংক্রিয়ভাবে উৎপাদন খরচ ও লাভ বের করে দেবে
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            + নতুন ক্যাটাগরি
          </button>
          <button
            onClick={() => openItemModal()}
            className="px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            + নতুন মেনু আইটেম
          </button>
        </div>
      </div>

      {/* Helpful Costing Explainer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
        <Calculator className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm text-amber-950">
            📊 রেসিপি ও উৎপাদন খরচ কীভাবে কাজ করে?
          </span>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            প্রতিটি আইটেমের ডানপাশের <strong>&quot;রেসিপি ও কস্টিং সেট করুন&quot;</strong> বাটনে ক্লিক করে আপনি যত খুশি কাঁচামাল (যেমন: বার্গারে প্যাটি ৬০ গ্রাম, বান ১ পিস, মেয়োনিজ ১৫ গ্রাম) যুক্ত করতে পারেন। সিস্টেম সাথে সাথে প্রতিটি কাঁচামালের দর অনুযায়ী <strong>সর্বমোট উৎপাদন খরচ</strong> বের করবে এবং মেনু বিক্রয় মূল্য থেকে বিয়োগ করে <strong>আপনার লাভ</strong> দেখিয়ে দেবে!
          </p>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
              <tr>
                <th className="p-3">আইটেম নাম</th>
                <th className="p-3">ক্যাটাগরি</th>
                <th className="p-3">বিক্রয় মূল্য (Price)</th>
                <th className="p-3">রেসিপি উৎপাদন খরচ (Cost)</th>
                <th className="p-3">প্রতি আইটেমে লাভ (Profit)</th>
                <th className="p-3 text-center">রেসিপি ও গ্রাম হিসাব</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : menuItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    বর্তমানে কোনো মেনু আইটেম নেই। &quot;+ নতুন মেনু আইটেম&quot; বাটনে ক্লিক করে যোগ করুন।
                  </td>
                </tr>
              ) : (
                menuItems.map((item) => {
                  const profit = Number(item.price) - Number(item.cost_price || 0)
                  const profitPercent =
                    Number(item.price) > 0 ? Math.round((profit / Number(item.price)) * 100) : 0
                  const recipeCount = item.recipes?.length || 0

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="p-3">
                        <div className="font-bold text-neutral-900 text-sm">{item.name}</div>
                        {item.name_bn && (
                          <div className="text-[11px] text-neutral-400">{item.name_bn}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {item.category?.icon || '🍽️'} {item.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-3 font-black text-neutral-900 text-sm">
                        ৳ {item.price}
                      </td>
                      <td className="p-3 font-bold text-neutral-700">
                        ৳ {item.cost_price || 0}
                      </td>
                      <td className="p-3">
                        <div className="font-black text-emerald-700 text-sm flex items-center gap-1">
                          +৳ {profit}
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            {profitPercent}% লাভ
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openRecipeModal(item)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Calculator className="w-3.5 h-3.5 text-amber-700" />
                          <span>রেসিপি ও কস্টিং সেট করুন</span>
                          <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                            {recipeCount}টি কাঁচামাল
                          </span>
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openItemModal(item)}
                            title="এডিট করুন"
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
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

      {/* Item Modal (Add / Edit Menu Item) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h2 className="font-black text-base text-neutral-900">
                {editingItem ? 'মেনু আইটেম এডিট করুন' : 'নতুন মেনু আইটেম যোগ করুন'}
              </h2>
              <button onClick={() => setIsItemModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700">আইটেমের নাম (ইংরেজিতে):</label>
                <input
                  type="text"
                  placeholder="যেমন: Pom Pom Mini Burger"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full mt-1 p-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">বাংলা নাম (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="যেমন: পম পম মিনি বার্গার"
                  value={itemNameBn}
                  onChange={(e) => setItemNameBn(e.target.value)}
                  className="w-full mt-1 p-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">ক্যাটাগরি:</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full mt-1 p-2 border border-neutral-300 rounded-lg focus:outline-none"
                >
                  <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || '🍽️'} {c.name_bn || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700">বিক্রয় মূল্য (টাকা ৳):</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full mt-1 p-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000] font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700">উৎপাদন খরচ (টাকা ৳):</label>
                  <input
                    type="number"
                    value={itemCostPrice}
                    onChange={(e) => setItemCostPrice(e.target.value)}
                    className="w-full mt-1 p-2 border border-neutral-300 rounded-lg focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    * রেসিপি সেট করলে স্বয়ংক্রিয়ভাবে বসে যাবে
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700">ছবির URL (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="https://... বা খালি রাখুন"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full mt-1 p-2 border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">সংক্ষিপ্ত বিবরণ:</label>
                <textarea
                  rows={2}
                  placeholder="খাবারের স্বাদ বা বিশেষত্ব সম্পর্কে লিখুন"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full mt-1 p-2 border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-neutral-300 text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-1 py-2 rounded-lg bg-[#CC0000] hover:bg-red-700 text-white font-bold text-xs shadow"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL INTERACTIVE RECIPE & COSTING BUILDER MODAL */}
      {isRecipeModalOpen && selectedMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h2 className="font-black text-lg text-neutral-900 flex items-center gap-1.5">
                  <Calculator className="w-5 h-5 text-amber-600" />
                  রেসিপি ও উৎপাদন কস্টিং: {selectedMenuItem.name}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  প্রতি ১টি {selectedMenuItem.name} তৈরি করতে কত গ্রাম কোন কাঁচামাল লাগবে তা নির্ধারণ করুন
                </p>
              </div>
              <button onClick={() => setIsRecipeModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* LIVE COST & PROFIT SUMMARY CARD */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-neutral-900 text-white rounded-xl shadow-md">
              <div className="text-center border-r border-neutral-700">
                <span className="text-[11px] text-neutral-400 font-bold block">
                  মোট উৎপাদন খরচ (Cost)
                </span>
                <span className="text-xl font-black text-yellow-300">
                  ৳ {modalRoundedCost}
                </span>
              </div>
              <div className="text-center border-r border-neutral-700">
                <span className="text-[11px] text-neutral-400 font-bold block">
                  মেনু বিক্রয় মূল্য (Price)
                </span>
                <span className="text-xl font-black text-white">
                  ৳ {modalSellingPrice}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[11px] text-neutral-400 font-bold block">
                  আপনার নিট লাভ (Profit)
                </span>
                <span className="text-xl font-black text-emerald-400">
                  +৳ {modalProfit}
                  <span className="text-[10px] block font-semibold text-emerald-300">
                    ({modalProfitPercent}% মার্জিন)
                  </span>
                </span>
              </div>
            </div>

            {/* Current Recipe Ingredients Breakdown Table */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-neutral-800 flex items-center justify-between">
                <span>এই আইটেমের বর্তমান রেসিপি কাঁচামালসমূহ:</span>
                <span className="text-[11px] text-neutral-500 font-normal">
                  মোট {currentRecipes.length}টি কাঁচামাল যুক্ত আছে
                </span>
              </h3>

              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
                    <tr>
                      <th className="p-2.5">কাঁচামালের নাম</th>
                      <th className="p-2.5">পরিমাণ</th>
                      <th className="p-2.5">একক দর</th>
                      <th className="p-2.5">মোট খরচ</th>
                      <th className="p-2.5 text-right">মুছুন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {currentRecipes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-400">
                          এখনো কোনো কাঁচামাল যুক্ত করা হয়নি। নিচের ফর্ম থেকে কাঁচামাল ও গ্রাম নির্ধারণ করুন।
                        </td>
                      </tr>
                    ) : (
                      currentRecipes.map((r) => {
                        const cost =
                          Number(r.quantity_gm) * Number(r.ingredient?.cost_per_unit || 0)
                        return (
                          <tr key={r.id} className="hover:bg-neutral-50">
                            <td className="p-2.5 font-bold text-neutral-800">
                              {r.ingredient?.name_bn || r.ingredient?.name}
                            </td>
                            <td className="p-2.5 font-semibold text-neutral-700">
                              {r.quantity_gm} {r.ingredient?.unit || 'gm'}
                            </td>
                            <td className="p-2.5 text-neutral-500">
                              ৳ {r.ingredient?.cost_per_unit || 0} / {r.ingredient?.unit}
                            </td>
                            <td className="p-2.5 font-black text-amber-900">
                              ৳ {Math.round(cost * 100) / 100}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleDeleteRecipe(r.id)}
                                className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ADD INGREDIENT TO RECIPE FORM */}
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-950 flex items-center gap-1">
                  <Plus className="w-4 h-4 text-amber-700" />
                  রেসিপিতে উপাদান ও গ্রাম যুক্ত করুন:
                </h4>
                <button
                  onClick={() => setIsQuickIngOpen(!isQuickIngOpen)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline"
                >
                  {isQuickIngOpen ? 'কাঁচামাল সিলেক্টে ফিরুন' : '+ নতুন কাঁচামাল তৈরি করুন (লিস্টে না থাকলে)'}
                </button>
              </div>

              {isQuickIngOpen ? (
                <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-2">
                  <span className="font-bold text-neutral-800 block">
                    নতুন কাঁচামালের নাম ও প্রতি গ্রাম/ইউনিটের দর দিন:
                  </span>
                  <input
                    type="text"
                    placeholder="যেমন: মোজারেলা চিজ, কাঁচা মরিচ, বার্গার প্যাটি"
                    value={quickIngName}
                    onChange={(e) => setQuickIngName(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={quickIngUnit}
                      onChange={(e) => setQuickIngUnit(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none"
                    >
                      <option value="gm">গ্রাম (gm)</option>
                      <option value="pcs">পিস (pcs)</option>
                      <option value="kg">কেজি (kg)</option>
                      <option value="ml">মিলি (ml)</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="দর (প্রতি গ্রাম বা ইউনিট ৳)"
                      value={quickIngCost}
                      onChange={(e) => setQuickIngCost(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none font-bold"
                    />
                  </div>
                  <button
                    onClick={handleQuickAddIngredient}
                    className="w-full py-1.5 bg-[#CC0000] text-white font-bold rounded-lg shadow-sm"
                  >
                    কাঁচামালটি তৈরি করে সিলেক্ট করুন
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <select
                      value={selectedIngredientId}
                      onChange={(e) => setSelectedIngredientId(e.target.value)}
                      className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none bg-white font-medium"
                    >
                      <option value="">কাঁচামাল নির্বাচন করুন</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name_bn || ing.name} ({ing.unit}) — ৳ {ing.cost_per_unit || 0}/{ing.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="পরিমাণ (গ্রাম/পিস)"
                      value={ingredientQuantity}
                      onChange={(e) => setIngredientQuantity(e.target.value)}
                      className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none bg-white font-bold"
                    />
                  </div>
                  <div className="col-span-3">
                    <button
                      onClick={handleAddRecipeIngredient}
                      className="w-full h-full bg-[#CC0000] hover:bg-red-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      যুক্ত করুন
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">
                * উপাদান যোগ বা গ্রাম পরিবর্তন করলে স্বয়ংক্রিয়ভাবে মোট উৎপাদন খরচ আপডেট হয়ে যাবে
              </span>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="px-5 py-2 bg-[#CC0000] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow"
              >
                রেসিপি সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-xs">
            <h3 className="font-bold text-sm text-neutral-900">নতুন ক্যাটাগরি যোগ করুন</h3>
            <div>
              <label className="font-semibold text-neutral-700">নাম (English):</label>
              <input
                type="text"
                placeholder="e.g. Burger"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700">নাম (বাংলা):</label>
              <input
                type="text"
                placeholder="যেমন: বার্গার"
                value={newCatNameBn}
                onChange={(e) => setNewCatNameBn(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700">আইকন (Emoji):</label>
              <input
                type="text"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="flex-1 py-1.5 border rounded-lg text-neutral-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveCategory}
                className="flex-1 py-1.5 bg-[#CC0000] text-white font-bold rounded-lg shadow"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
