'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit3, Upload, Save, X, UtensilsCrossed } from 'lucide-react'

interface MenuItem {
  id: string | number
  name: string
  price: number
  category: string
  image_url: string
  description?: string
  is_available?: boolean
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // Add / Edit Form State
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
        .order('id', { ascending: true })
      if (data) {
        setItems(data)
      }
    } catch {
      const local = localStorage.getItem('pompom_custom_menu')
      if (local) setItems(JSON.parse(local))
    }
    setLoading(false)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 600
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        setImageUrl(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
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
    alert('মেনু আইটেম সফলভাবে সেভ হয়েছে!')
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
            <label className="block text-xs font-bold text-neutral-700 mb-1">খাবারের নাম</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: Crispy Chicken Fry (2 Pcs)"
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">দাম (৳)</label>
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
              placeholder="যেমন: Chicken, Burger, Bucket, Drinks"
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              ছোট বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: Hot & crispy fried chicken"
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          {/* Image Upload Box */}
          <div className="sm:col-span-2 p-4 border rounded-2xl bg-neutral-50 flex flex-col sm:flex-row items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Menu Preview"
              className="w-24 h-24 rounded-xl object-cover border bg-white shrink-0"
            />
            <div className="w-full space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-black">
                <Upload className="w-4 h-4" />
                <span>মেনুর ছবি আপলোড করুন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="অথবা ছবির লিংক (URL) দিন..."
                className="w-full p-2 border rounded-lg text-xs bg-white"
              />
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

      {/* Existing Menu List */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-neutral-900">বর্তমান মেনু তালিকা ({items.length})</h2>
        {loading ? (
          <p className="text-sm text-neutral-500">লোড হচ্ছে...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl overflow-hidden flex flex-col justify-between bg-neutral-50"
              >
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url || '/menu-card.png'}
                    alt={item.name}
                    className="w-full aspect-square object-cover bg-white"
                  />
                  <div className="p-3">
                    <span className="text-[10px] font-bold uppercase bg-red-100 text-[#CC0000] px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-sm text-neutral-900 mt-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="font-black text-[#CC0000] text-base mt-1">৳ {item.price}</p>
                  </div>
                </div>
                <div className="p-2 pt-0 flex gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="flex-1 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> এডিট
                  </button>
                  <button
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
