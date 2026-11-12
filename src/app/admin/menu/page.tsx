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
  const [uploading, setUploading] = useState(false)

  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Chicken')
  const [imageUrl, setImageUrl] = useState('/menu-card.png')
  const [description, setDescription] = useState('')
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now())

  useEffect(() => {
    fetchMenu()
  }, [])

  async function fetchMenu() {
    setLoading(true)
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })

    if (error) {
      alert('মেনু লোড হয়নি: ' + error.message)
    } else if (data) {
      setItems(data)
    }
    setLoading(false)
  }

  // ছবি ছোট করে Supabase Storage-এ আপলোড করে লিংক সেট করে
  async function
