'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit3, Upload, Save, X, UtensilsCrossed, ArrowUp, ArrowDown } from 'lucide-react'

interface MenuItem {
  id: string | number
  name: string
  price: number
  category: string
  image_url: string
  description?: string
  is_available?: boolean
  sort_order?: number
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Chicken')
  const [imageUrl, setImageUrl] = useState('/menu-card.png')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchMenu()
  }, [])

  async function fetchMenu() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })

      if (data && data.length > 0) {
        setItems(data)
      } else {
        const local = localStorage.getItem('pompom_custom_menu')
        if (local) setItems(JSON.parse(local))
      }
    } catch {
      const local = localStorage.getItem('pompom_custom_menu')
      if (local) setItems(JSON.parse(local))
    }
    setLoading(false)
  }

  // Handle Local Computer Image Selection & Conversion
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 700
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        setImageUrl(compressed)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Move item up or down in order
  async function handleMoveOrder(index: number, direction: 'up' | 'down') {
    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newItems.length) return

    // Swap items
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp

    // Assign new sort_order values
    const updated = newItems.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }))

    setItems(updated)
    localStorage.setItem('pompom_custom_menu', JSON.stringify(updated))

    // Save to Supabase
    try {
      for (const it of updated) {
        await supabase.from('menu_items').update({ sort_order: it.sort_order }).eq('id', it.id)
      }
    } catch {
      // Local sync handled
    }
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setPrice('')
    setCategory('Chicken')
    setImageUrl('/menu-card.png')
    setDescription('')
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setName(item.name)
    setPrice(String(item.price))
    setCategory(item.category || 'Chicken')
    setImageUrl(item.image_url || '/menu-card.png')
    setDescription(item.description || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSaveMenu(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price) return

    const payload = {
      name: name.trim(),
      price: Number(price),
      category: category.trim() || 'Menu',
      image_url: imageUrl || '/menu-card.png',
      description: description.trim(),
      is_available: true,
      sort_order: editingId !== null ? items.find(i => i.id === editingId)?.sort_order || items.length + 1 : items.length + 1,
    }

    try {
      if (editingId !== null) {
        await supabase.from('menu_items').update(payload).eq('id', editingId)
      } else {
        await supabase.from('menu_items').insert([payload])
      }
      await fetchMenu()
    } catch {
      const updated =
        editingId !== null
          ? items.map((it) => (it.id === editingId ? { ...it, ...payload } : it))
          : [...items, { id: Date.now(), ...payload }]
      setItems(updated)
      localStorage.setItem('pompom_custom_menu', JSON.stringify(updated))
    }

    resetForm()
    alert('মেনু আইটেম ও সিরিয়াল সফলভাবে সেভ হয়েছে!')
  }

  async function handleDelete(id: string | number) {
    if (!confirm('আপনি কি এই মেনু আইটেমটি ডিলিট করতে চান?')) return
    try {
      await supabase.from('menu_items').delete().eq('id', id)
      await fetchMenu()
    } catch {
      const filtered = items.filter((it) => it.id !== id)
      setItems(filtered)
      localStorage.setItem('pompom_custom_menu', JSON.stringify(filtered))
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Add / Edit Form */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#CC0000]" />
            <span>{editingId ? 'মেনু আইটেম এডিট করুন' : 'নতুন মেনু ও ছবি যোগ করুন'}</span>
          </h1>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs font-bold text-neutral-500 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> বাতিল
            </button>
          )}
        </div>

        <form onSubmit={handleSaveMenu} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">আইটেমের নাম</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: Crispy Chicken Fry"
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">বিক্রয় মূল্য (৳)</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="যেমন: 220"
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">ক্যাটাগরি</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="যেমন: Chicken, Burger"
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">সংক্ষিপ্ত বিবরণ</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: Hot & crispy fried chicken"
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          {/* Computer Drive Image Upload */}
          <div className="sm:col-span-2 p-4 border rounded-2xl bg-neutral-50 flex flex-col sm:flex-row items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="w-24 h-24 rounded-xl object-cover border bg-white shrink-0"
            />
            <div className="w-full space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-black">
                <Upload className="w-4 h-4" />
                <span>কম্পিউটার ড্রাইভ থেকে ছবি সিলেক্ট করুন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-neutral-500">
                যেকোনো ছবি সিলেক্ট করলেই তা স্বয়ংক্রিয়ভাবে রিসাইজ ও সেট হয়ে যাবে।
              </p>
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#CC0000] hover:bg-red-700 text-white font-black rounded-xl text-sm shadow flex items-center justify-center gap-2"
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingId ? 'পরিবর্তন আপডেট করুন' : 'মেনুতে যোগ করুন'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Menu Order Management List */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-neutral-900">
            মেনু সিরিয়াল ও সাজানো (Drag & Reorder) ({items.length})
          </h2>
          <p className="text-xs text-neutral-500">
            বাটন দিয়ে উপরে বা নিচে নিয়ে সিরিয়াল সাজান—মেইন সাইটে সাথে সাথে আপডেট হয়ে যাবে।
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">লোড হচ্ছে...</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-neutral-50 border rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-red-100 text-[#CC0000] font-black text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url || '/menu-card.png'}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover border bg-white shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">{item.name}</h3>
                    <p className="text-xs text-[#CC0000] font-bold">৳ {item.price} • {item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    title="উপরে নিন"
                    className="p-2 bg-white border rounded-lg hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4 text-neutral-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === items.length - 1}
                    title="নিচে নিন"
                    className="p-2 bg-white border rounded-lg hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4 text-neutral-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> এডিট
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
