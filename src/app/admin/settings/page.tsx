'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Save,
  KeyRound,
  Palette,
  Image as ImageIcon,
  Store,
  CheckCircle2,
  Upload,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // 1. Security & Recovery
  const [adminPin, setAdminPin] = useState('1234')
  const [kitchenPin, setKitchenPin] = useState('2222')
  const [whatsapp, setWhatsapp] = useState('8801700000000')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryOption, setRecoveryOption] = useState('whatsapp')

  // 2. Shop Info & Colors
  const [shopName, setShopName] = useState('POM POM')
  const [shopAddress, setShopAddress] = useState('Jhenaidah Sadar, Jhenaidah, Bangladesh')
  const [primaryColor, setPrimaryColor] = useState('#CC0000')
  const [accentColor, setAccentColor] = useState('#FFD700')
  const [buttonColor, setButtonColor] = useState('#CC0000')

  // 3. Homepage Pictures & Featured Content
  const [heroTitle, setHeroTitle] = useState("LET'S START ORDERING")
  const [heroBgImage, setHeroBgImage] = useState('/menu-card.png')
  const [heroBucketImage, setHeroBucketImage] = useState('/menu-card.png')
  const [featuredTitle, setFeaturedTitle] = useState('Crispy Chicken Fry')
  const [featuredPrice, setFeaturedPrice] = useState('150')
  const [featuredOldPrice, setFeaturedOldPrice] = useState('300')
  const [featuredBadge, setFeaturedBadge] = useState('50% OFFER')
  const [featuredImage, setFeaturedImage] = useState('/menu-card.png')

  useEffect(() => {
    loadAllSettings()
  }, [])

  async function loadAllSettings() {
    // Load from localStorage first
    setAdminPin(localStorage.getItem('pompom_admin_pin') || '1234')
    setKitchenPin(localStorage.getItem('pompom_kitchen_pin') || '2222')
    setWhatsapp(localStorage.getItem('pompom_whatsapp') || '8801700000000')
    setRecoveryEmail(localStorage.getItem('pompom_recovery_email') || '')
    setRecoveryOption(localStorage.getItem('pompom_recovery_option') || 'whatsapp')

    setShopName(localStorage.getItem('pompom_shop_name') || 'POM POM')
    setShopAddress(localStorage.getItem('pompom_shop_address') || 'Jhenaidah Sadar, Jhenaidah, Bangladesh')
    setPrimaryColor(localStorage.getItem('pompom_primary_color') || '#CC0000')
    setAccentColor(localStorage.getItem('pompom_accent_color') || '#FFD700')
    setButtonColor(localStorage.getItem('pompom_button_color') || '#CC0000')

    setHeroTitle(localStorage.getItem('pompom_hero_title') || "LET'S START ORDERING")
    setHeroBgImage(localStorage.getItem('pompom_hero_bg') || '/menu-card.png')
    setHeroBucketImage(localStorage.getItem('pompom_hero_bucket') || '/menu-card.png')
    setFeaturedTitle(localStorage.getItem('pompom_featured_title') || 'Crispy Chicken Fry')
    setFeaturedPrice(localStorage.getItem('pompom_featured_price') || '150')
    setFeaturedOldPrice(localStorage.getItem('pompom_featured_old_price') || '300')
    setFeaturedBadge(localStorage.getItem('pompom_featured_badge') || '50% OFFER')
    setFeaturedImage(localStorage.getItem('pompom_featured_image') || '/menu-card.png')

    try {
      const { data } = await supabase.from('settings').select('*')
      if (data && data.length > 0) {
        const map: Record<string, string> = {}
        data.forEach((row) => {
          if (row.key && row.value) map[row.key] = row.value
        })
        if (map.admin_pin) setAdminPin(map.admin_pin)
        if (map.kitchen_pin) setKitchenPin(map.kitchen_pin)
        if (map.whatsapp) setWhatsapp(map.whatsapp)
        if (map.recovery_email) setRecoveryEmail(map.recovery_email)
        if (map.recovery_option) setRecoveryOption(map.recovery_option)
        if (map.shop_name) setShopName(map.shop_name)
        if (map.shop_address) setShopAddress(map.shop_address)
        if (map.primary_color) setPrimaryColor(map.primary_color)
        if (map.accent_color) setAccentColor(map.accent_color)
        if (map.button_color) setButtonColor(map.button_color)
        if (map.hero_title) setHeroTitle(map.hero_title)
        if (map.hero_bg) setHeroBgImage(map.hero_bg)
        if (map.hero_bucket) setHeroBucketImage(map.hero_bucket)
        if (map.featured_title) setFeaturedTitle(map.featured_title)
        if (map.featured_price) setFeaturedPrice(map.featured_price)
        if (map.featured_old_price) setFeaturedOldPrice(map.featured_old_price)
        if (map.featured_badge) setFeaturedBadge(map.featured_badge)
        if (map.featured_image) setFeaturedImage(map.featured_image)
      }
    } catch {
      // Offline fallback
    }
  }

  // Convert uploaded image file to compressed Base64 so it works instantly everywhere
  function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 900
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setter(compressedDataUrl)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)

    // Save to localStorage
    localStorage.setItem('pompom_admin_pin', adminPin.trim())
    localStorage.setItem('pompom_kitchen_pin', kitchenPin.trim())
    localStorage.setItem('pompom_whatsapp', whatsapp.trim())
    localStorage.setItem('pompom_recovery_email', recoveryEmail.trim())
    localStorage.setItem('pompom_recovery_option', recoveryOption)

    localStorage.setItem('pompom_shop_name', shopName.trim())
    localStorage.setItem('pompom_shop_address', shopAddress.trim())
    localStorage.setItem('pompom_primary_color', primaryColor)
    localStorage.setItem('pompom_accent_color', accentColor)
    localStorage.setItem('pompom_button_color', buttonColor)

    localStorage.setItem('pompom_hero_title', heroTitle)
    localStorage.setItem('pompom_hero_bg', heroBgImage)
    localStorage.setItem('pompom_hero_bucket', heroBucketImage)
    localStorage.setItem('pompom_featured_title', featuredTitle)
    localStorage.setItem('pompom_featured_price', featuredPrice)
    localStorage.setItem('pompom_featured_old_price', featuredOldPrice)
    localStorage.setItem('pompom_featured_badge', featuredBadge)
    localStorage.setItem('pompom_featured_image', featuredImage)

    // Save to Supabase settings table
    const entries = [
      { key: 'admin_pin', value: adminPin.trim() },
      { key: 'kitchen_pin', value: kitchenPin.trim() },
      { key: 'whatsapp', value: whatsapp.trim() },
      { key: 'recovery_email', value: recoveryEmail.trim() },
      { key: 'recovery_option', value: recoveryOption },
      { key: 'shop_name', value: shopName.trim() },
      { key: 'shop_address', value: shopAddress.trim() },
      { key: 'primary_color', value: primaryColor },
      { key: 'accent_color', value: accentColor },
      { key: 'button_color', value: buttonColor },
      { key: 'hero_title', value: heroTitle },
      { key: 'hero_bg', value: heroBgImage },
      { key: 'hero_bucket', value: heroBucketImage },
      { key: 'featured_title', value: featuredTitle },
      { key: 'featured_price', value: featuredPrice },
      { key: 'featured_old_price', value: featuredOldPrice },
      { key: 'featured_badge', value: featuredBadge },
      { key: 'featured_image', value: featuredImage },
    ]

    try {
      for (const item of entries) {
        await supabase.from('settings').upsert(item, { onConflict: 'key' })
      }
    } catch {
      // Saved locally even if Supabase key structure differs
    }

    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 4000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-neutral-900">
              সেটিংস, ডিজাইন ও সিকিউরিটি কন্ট্রোল
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              এখান থেকে পিন, রিকভারি নাম্বার/ইমেইল, হোমপেজের ছবি এবং বাটন কালার পরিবর্তন করুন
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] px-6 py-3 bg-[#CC0000] hover:bg-red-700 text-white font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সেভ হচ্ছে...' : 'সব পরিবর্তন সেভ করুন'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>সব সেটিংস, ছবি ও কালার সফলভাবে আপডেট হয়েছে! হোমপেজে গিয়ে পরিবর্তন দেখতে পারেন।</span>
          </div>
        )}

        {/* SECTION 1: PIN & RECOVERY SETTINGS */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <KeyRound className="w-5 h-5 text-[#CC0000]" />
            <h2 className="text-lg font-black text-neutral-900">
              ১. অ্যাডমিন ও কিচেন পিন এবং রিকভারি সেটিংস
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                অ্যাডমিন পিন (Admin PIN)
              </label>
              <input
                type="text"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full p-3 border rounded-xl font-mono font-bold text-sm"
                placeholder="যেমন: 1234"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                কিচেন স্টাফ পিন (Kitchen PIN)
              </label>
              <input
                type="text"
                value={kitchenPin}
                onChange={(e) => setKitchenPin(e.target.value)}
                className="w-full p-3 border rounded-xl font-mono font-bold text-sm"
                placeholder="যেমন: 2222"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                অর্ডার ও রিকভারি হোয়াটসঅ্যাপ নাম্বার (WhatsApp)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm"
                placeholder="88017XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                রিকভারি ইমেইল অ্যাড্রেস (Recovery Email)
              </label>
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm"
                placeholder="owner@example.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                ডিফল্ট রিকভারি অপশন (Recovery Option)
              </label>
              <select
                value={recoveryOption}
                onChange={(e) => setRecoveryOption(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm bg-white"
              >
                <option value="whatsapp">WhatsApp OTP Recovery (হোয়াটসঅ্যাপ)</option>
                <option value="email">Email Recovery (ইমেইল)</option>
                <option value="both">Both WhatsApp & Email (উভয়ই)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: SHOP NAME & THEME COLORS */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Palette className="w-5 h-5 text-[#CC0000]" />
            <h2 className="text-lg font-black text-neutral-900">
              ২. দোকানের নাম, ঠিকানা ও ড্যাশবোর্ড/বাটন কালার
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                রেস্টুরেন্টের নাম (Shop Name)
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                ঠিকানা (Shop Address)
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-800">প্রাইমারি কালার (Header/Theme)</p>
                <p className="text-[11px] font-mono text-neutral-500">{primaryColor}</p>
              </div>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
            </div>

            <div className="p-3 border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-800">বাটন কালার (Order Buttons)</p>
                <p className="text-[11px] font-mono text-neutral-500">{buttonColor}</p>
              </div>
              <input
                type="color"
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
            </div>

            <div className="p-3 border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-800">হাইলাইট কালার (Badge/Gold)</p>
                <p className="text-[11px] font-mono text-neutral-500">{accentColor}</p>
              </div>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: MAIN INTERFACE PICTURES & FEATURED BANNER */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <ImageIcon className="w-5 h-5 text-[#CC0000]" />
            <h2 className="text-lg font-black text-neutral-900">
              ৩. হোমপেজ ইন্টারফেস ও মেইন পিকচারস পরিবর্তন করুন
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hero Background Picture */}
            <div className="p-4 border rounded-2xl space-y-3 bg-neutral-50">
              <label className="block text-xs font-black text-neutral-800">
                হিরো ব্যাকগ্রাউন্ড ছবি (Hero Background Image)
              </label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroBgImage}
                alt="Hero Preview"
                className="w-full h-36 object-cover rounded-xl border bg-white"
              />
              <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-black">
                <Upload className="w-4 h-4" />
                <span>গ্যালারি থেকে ছবি আপলোড করুন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setHeroBgImage)}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={heroBgImage}
                onChange={(e) => setHeroBgImage(e.target.value)}
                placeholder="অথবা ছবির URL দিন..."
                className="w-full p-2 border rounded-lg text-xs bg-white"
              />
            </div>

            {/* Hero Chicken Bucket Picture */}
            <div className="p-4 border rounded-2xl space-y-3 bg-neutral-50">
              <label className="block text-xs font-black text-neutral-800">
                হিরো বাকেট / মেইন প্রোডাক্ট ছবি (Hero Center Image)
              </label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroBucketImage}
                alt="Bucket Preview"
                className="w-full h-36 object-contain rounded-xl border bg-white"
              />
              <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-black">
                <Upload className="w-4 h-4" />
                <span>গ্যালারি থেকে ছবি আপলোড করুন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setHeroBucketImage)}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={heroBucketImage}
                onChange={(e) => setHeroBucketImage(e.target.value)}
                placeholder="অথবা ছবির URL দিন..."
                className="w-full p-2 border rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          {/* Featured Product Settings */}
          <div className="border-t pt-5 space-y-4">
            <h3 className="text-sm font-black text-neutral-800 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-[#CC0000]" />
              ফিচার্ড প্রোডাক্ট ব্যানার (Featured Product) এডিট
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  প্রোডাক্টের নাম
                </label>
                <input
                  type="text"
                  value={featuredTitle}
                  onChange={(e) => setFeaturedTitle(e.target.value)}
                  className="w-full p-3 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  অফার ব্যাজ লেখা (Offer Badge)
                </label>
                <input
                  type="text"
                  value={featuredBadge}
                  onChange={(e) => setFeaturedBadge(e.target.value)}
                  className="w-full p-3 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  বর্তমান অফার দাম (৳)
                </label>
                <input
                  type="number"
                  value={featuredPrice}
                  onChange={(e) => setFeaturedPrice(e.target.value)}
                  className="w-full p-3 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  আগের দাম (৳ - কাটা দাগ থাকবে)
                </label>
                <input
                  type="number"
                  value={featuredOldPrice}
                  onChange={(e) => setFeaturedOldPrice(e.target.value)}
                  className="w-full p-3 border rounded-xl text-sm"
                />
              </div>

              <div className="sm:col-span-2 p-4 border rounded-2xl bg-neutral-50 space-y-3">
                <label className="block text-xs font-black text-neutral-800">
                  ফিচার্ড প্রোডাক্টের ছবি পরিবর্তন করুন
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredImage}
                    alt="Featured Preview"
                    className="w-32 h-24 object-cover rounded-xl border bg-white shrink-0"
                  />
                  <div className="w-full space-y-2">
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-black">
                      <Upload className="w-4 h-4" />
                      <span>নতুন ছবি আপলোড করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setFeaturedImage)}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="অথবা ছবির URL দিন..."
                      className="w-full p-2 border rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] bg-[#CC0000] hover:bg-red-700 text-white font-black rounded-2xl text-base shadow-xl flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'সেভ হচ্ছে...' : 'সব পরিবর্তন সেভ করুন'}</span>
        </button>
      </form>
    </div>
  )
}
