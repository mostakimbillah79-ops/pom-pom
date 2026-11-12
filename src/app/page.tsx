'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MapPin,
  Phone,
  ShoppingBag,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Store,
  Truck,
  Utensils,
} from 'lucide-react'

interface MenuItem {
  id: string | number
  name: string
  price: number
  category?: string
  image_url?: string
  description?: string
  is_available?: boolean
  sort_order?: number
}

const FALLBACK_MENU: MenuItem[] = [
  {
    id: 1,
    name: 'Crispy Chicken Fry (2 Pcs)',
    price: 220,
    category: 'Chicken',
    image_url: '/menu-card.png',
    description: 'Hot & crispy signature fried chicken',
    sort_order: 1,
  },
  {
    id: 2,
    name: 'POM POM Chicken Bucket (6 Pcs)',
    price: 590,
    category: 'Bucket',
    image_url: '/menu-card.png',
    description: 'Family crispy chicken bucket with dips',
    sort_order: 2,
  },
  {
    id: 3,
    name: 'Zinger Crispy Burger',
    price: 180,
    category: 'Burger',
    image_url: '/menu-card.png',
    description: 'Crunchy chicken fillet with spicy mayo',
    sort_order: 3,
  },
  {
    id: 4,
    name: 'Spicy Chicken Wings (6 Pcs)',
    price: 210,
    category: 'Snacks',
    image_url: '/menu-card.png',
    description: 'Glazed fiery crispy chicken wings',
    sort_order: 4,
  },
]

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(FALLBACK_MENU)
  const [whatsappNumber, setWhatsappNumber] = useState<string>('8801700000000')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const [shopName, setShopName] = useState<string>('POM POM')
  const [shopAddress, setShopAddress] = useState<string>('Jhenaidah Sadar, Jhenaidah, Bangladesh')
  const [buttonColor, setButtonColor] = useState<string>('#CC0000')
  const [accentColor, setAccentColor] = useState<string>('#FFD700')
  const [heroBgImage, setHeroBgImage] = useState<string>('/menu-card.png')
  const [heroBucketImage, setHeroBucketImage] = useState<string>('/menu-card.png')
  const [featuredTitle, setFeaturedTitle] = useState<string>('Crispy Chicken Fry')
  const [featuredPrice, setFeaturedPrice] = useState<string>('150')
  const [featuredOldPrice, setFeaturedOldPrice] = useState<string>('300')
  const [featuredBadge, setFeaturedBadge] = useState<string>('50% OFFER')
  const [featuredImage, setFeaturedImage] = useState<string>('/menu-card.png')

  const [showLocationModal, setShowLocationModal] = useState<boolean>(false)
  const [pendingOrderText, setPendingOrderText] = useState<string>('')
  const [locationStatus, setLocationStatus] = useState<
    'prompt' | 'checking' | 'inside' | 'outside' | 'denied'
  >('prompt')
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [customerMapsLink, setCustomerMapsLink] = useState<string>('')

  useEffect(() => {
    loadLocalThemeAndImages()
    fetchData()
  }, [])

  function loadLocalThemeAndImages() {
    setShopName(localStorage.getItem('pompom_shop_name') || 'POM POM')
    setShopAddress(
      localStorage.getItem('pompom_shop_address') || 'Jhenaidah Sadar, Jhenaidah, Bangladesh'
    )
    setButtonColor(localStorage.getItem('pompom_button_color') || '#CC0000')
    setAccentColor(localStorage.getItem('pompom_accent_color') || '#FFD700')
    setHeroBgImage(localStorage.getItem('pompom_hero_bg') || '/menu-card.png')
    setHeroBucketImage(localStorage.getItem('pompom_hero_bucket') || '/menu-card.png')
    setFeaturedTitle(localStorage.getItem('pompom_featured_title') || 'Crispy Chicken Fry')
    setFeaturedPrice(localStorage.getItem('pompom_featured_price') || '150')
    setFeaturedOldPrice(localStorage.getItem('pompom_featured_old_price') || '300')
    setFeaturedBadge(localStorage.getItem('pompom_featured_badge') || '50% OFFER')
    setFeaturedImage(localStorage.getItem('pompom_featured_image') || '/menu-card.png')
    const localWa = localStorage.getItem('pompom_whatsapp')
    if (localWa) setWhatsappNumber(localWa.replace(/[^0-9]/g, ''))
  }

  async function fetchData() {
    try {
      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })

      if (items && items.length > 0) {
        setMenuItems(items.filter((i) => i.is_available !== false))
      } else {
        const localMenu = localStorage.getItem('pompom_custom_menu')
        if (localMenu) {
          const parsed = JSON.parse(localMenu)
          parsed.sort((a: MenuItem, b: MenuItem) => (a.sort_order || 0) - (b.sort_order || 0))
          setMenuItems(parsed)
        }
      }

      const { data: settingsData } = await supabase.from('settings').select('*')
      if (settingsData) {
        const map: Record<string, string> = {}
        settingsData.forEach((s) => {
          if (s.key && s.value) map[s.key] = s.value
        })
        if (map.whatsapp) setWhatsappNumber(map.whatsapp.replace(/[^0-9]/g, ''))
        if (map.shop_name) setShopName(map.shop_name)
        if (map.shop_address) setShopAddress(map.shop_address)
        if (map.button_color) setButtonColor(map.button_color)
        if (map.accent_color) setAccentColor(map.accent_color)
        if (map.hero_bg) setHeroBgImage(map.hero_bg)
        if (map.hero_bucket) setHeroBucketImage(map.hero_bucket)
        if (map.featured_title) setFeaturedTitle(map.featured_title)
        if (map.featured_price) setFeaturedPrice(map.featured_price)
        if (map.featured_old_price) setFeaturedOldPrice(map.featured_old_price)
        if (map.featured_badge) setFeaturedBadge(map.featured_badge)
        if (map.featured_image) setFeaturedImage(map.featured_image)
      }
    } catch {
      const localMenu = localStorage.getItem('pompom_custom_menu')
      if (localMenu) {
        const parsed = JSON.parse(localMenu)
        parsed.sort((a: MenuItem, b: MenuItem) => (a.sort_order || 0) - (b.sort_order || 0))
        setMenuItems(parsed)
      }
    }
  }

  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  function initiateDeliveryOrder(orderSummary: string) {
    setPendingOrderText(orderSummary)
    setLocationStatus('prompt')
    setDistanceKm(null)
    setShowLocationModal(true)
  }

  function handleAllowLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }

    setLocationStatus('checking')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLon = position.coords.longitude
        const centerLat = 23.5448
        const centerLon = 89.1726

        const dist = getDistanceFromLatLonInKm(userLat, userLon, centerLat, centerLon)
        setDistanceKm(Number(dist.toFixed(2)))

        const mapsUrl = `https://www.google.com/maps?q=${userLat},${userLon}`
        setCustomerMapsLink(mapsUrl)

        if (dist <= 6) {
          setLocationStatus('inside')
        } else {
          setLocationStatus('outside')
        }
      },
      () => {
        setLocationStatus('denied')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  function openWhatsAppOrder(mode: 'DELIVERY' | 'TAKEAWAY', mapsLink?: string) {
    let message = `🍗 *NEW ORDER - ${shopName}*\n`
    message += `📦 *Order Type:* ${mode}\n`
    message += `🛒 *Items:* ${pendingOrderText || 'Menu Selection'}\n`
    if (mode === 'DELIVERY' && mapsLink) {
      message += `📍 *Delivery Location:* ${mapsLink}\n`
    }

    const cleanWa = whatsappNumber.startsWith('88') ? whatsappNumber : `88${whatsappNumber}`
    const url = `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    setShowLocationModal(false)
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category || 'Menu')))]
  const filteredMenu =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((m) => (m.category || 'Menu') === selectedCategory)

  return (
    <div className="w-full overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative bg-neutral-950 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105"
          style={{ backgroundImage: `url('${heroBgImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-neutral-950" />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-12 sm:py-16 text-center flex flex-col items-center">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-4 shadow"
            style={{ backgroundColor: accentColor, color: buttonColor }}
          >
            <Flame className="w-3.5 h-3.5" /> Hot & Crispy • Jhenaidah Sadar
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-tight max-w-xl mx-auto">
            LET&apos;S START
            <span className="block" style={{ color: accentColor }}>
              ORDERING
            </span>
          </h1>

          <p className="text-neutral-300 text-xs sm:text-base mt-3 max-w-md mx-auto">
            ঝিনাইদহ শহরের সেরা ক্রিস্পি চিকেন ফ্রাই ও বার্গার এখন আপনার হাতের মুঠোয়।
          </p>

          <div className="w-full max-w-2xl mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => initiateDeliveryOrder('General Delivery Order')}
              style={{ backgroundColor: buttonColor }}
              className="min-h-[52px] flex-1 hover:opacity-90 active:scale-95 text-white font-black text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Truck className="w-5 h-5" style={{ color: accentColor }} />
              <span>DELIVERY</span>
            </button>

            <button
              onClick={() => scrollToSection('menu-section')}
              style={{ backgroundColor: buttonColor }}
              className="min-h-[52px] flex-1 hover:opacity-90 active:scale-95 text-white font-black text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingBag className="w-5 h-5" style={{ color: accentColor }} />
              <span>TAKEAWAY</span>
            </button>

            <button
              onClick={() => scrollToSection('location-section')}
              style={{ backgroundColor: buttonColor }}
              className="min-h-[52px] flex-1 hover:opacity-90 active:scale-95 text-white font-black text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Utensils className="w-5 h-5" style={{ color: accentColor }} />
              <span>DINE-IN</span>
            </button>
          </div>

          <div className="mt-8 w-full max-w-md mx-auto">
            <div
              className="relative rounded-2xl overflow-hidden border-4 shadow-2xl bg-neutral-900"
              style={{ borderColor: accentColor }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroBucketImage}
                alt="Hero Product"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED PRODUCT SECTION */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8">
          <div className="h-[2px] flex-1 bg-neutral-300" />
          <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-wider uppercase text-center shrink-0">
            FEATURED PRODUCT
          </h2>
          <div className="h-[2px] flex-1 bg-neutral-300" />
        </div>

        <div
          className="rounded-3xl overflow-hidden shadow-2xl border-2 flex flex-col md:flex-row items-center"
          style={{ backgroundColor: buttonColor, borderColor: accentColor }}
        >
          <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:h-80 bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredImage}
              alt={featuredTitle}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute top-3 left-3 font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-wide"
              style={{ backgroundColor: accentColor, color: buttonColor }}
            >
              🔥 {featuredBadge}
            </div>
          </div>

          <div className="w-full md:w-1/2 p-6 sm:p-10 text-white flex flex-col justify-center space-y-4">
            <span
              className="text-xs font-extrabold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              ★ Best Seller Special
            </span>
            <h3 className="text-2xl sm:text-4xl font-black leading-tight">{featuredTitle}</h3>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              মচমচে গোল্ডেন ক্রাস্ট আর ভেতরে জুসি চিকেন—স্পেশাল সিক্রেট মসলায় তৈরি ঝিনাইদহের সেরা চিকেন ফ্রাই!
            </p>

            <div className="flex items-baseline gap-3 pt-1">
              <span
                className="text-3xl sm:text-4xl font-black"
                style={{ color: accentColor }}
              >
                ৳ {featuredPrice}
              </span>
              {featuredOldPrice && (
                <span className="text-base sm:text-lg text-white/70 line-through font-bold">
                  ৳ {featuredOldPrice}
                </span>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() =>
                  initiateDeliveryOrder(`${featuredTitle} (${featuredBadge} - ৳${featuredPrice})`)
                }
                style={{ backgroundColor: accentColor, color: buttonColor }}
                className="w-full sm:w-auto min-h-[50px] px-8 py-3 hover:opacity-90 active:scale-95 font-black text-base rounded-xl shadow-lg transition-all"
              >
                Order Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MENU SECTION (Ordered Automatically by Admin sort_order) */}
      <section id="menu-section" className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-6">
          <div className="h-[2px] flex-1 bg-neutral-300" />
          <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-wider uppercase shrink-0">
            OUR MENU
          </h2>
          <div className="h-[2px] flex-1 bg-neutral-300" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={selectedCategory === cat ? { backgroundColor: buttonColor } : undefined}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'text-white shadow'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full"
            >
              <div className="p-2 pb-0">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url || '/menu-card.png'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="p-3 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 line-clamp-2 leading-snug">
                    {item.name}
                  </h3>
                  <p
                    className="font-black text-base sm:text-lg mt-1.5"
                    style={{ color: buttonColor }}
                  >
                    ৳ {item.price}
                  </p>
                </div>

                <button
                  onClick={() => initiateDeliveryOrder(`${item.name} (৳${item.price})`)}
                  style={{ backgroundColor: buttonColor }}
                  className="w-full mt-3 min-h-[48px] hover:opacity-90 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all"
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LOCATION SECTION */}
      <section id="location-section" className="bg-white border-t border-neutral-200 py-10 sm:py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8">
            <div className="h-[2px] flex-1 bg-neutral-300" />
            <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-wider uppercase shrink-0">
              DINE-IN & LOCATION
            </h2>
            <div className="h-[2px] flex-1 bg-neutral-300" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 space-y-4">
              <div className="flex items-start gap-3">
                <Store className="w-6 h-6 shrink-0 mt-0.5" style={{ color: buttonColor }} />
                <div>
                  <h3 className="font-black text-lg text-neutral-900">{shopName}</h3>
                  <p className="text-sm text-neutral-600">{shopAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: buttonColor }} />
                <div>
                  <p className="text-sm font-bold text-neutral-800">Opening Hours</p>
                  <p className="text-xs text-neutral-600">Everyday: 11:00 AM – 10:30 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: buttonColor }} />
                <div>
                  <p className="text-sm font-bold text-neutral-800">Delivery Area</p>
                  <p className="text-xs text-neutral-600">
                    Inside Jhenaidah Sadar (Within 6 km radius)
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full h-64 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
              <iframe
                title="Shop Location Map"
                src="https://www.google.com/maps?q=23.5448,89.1726&hl=en&z=14&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer
        className="bg-neutral-950 text-neutral-300 py-10 px-4 border-t-4"
        style={{ borderColor: buttonColor }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-wider" style={{ color: accentColor }}>
              {shopName}
            </h3>
            <p className="text-xs text-neutral-400">Passion of Making • Promise of More</p>
            <p className="text-xs text-neutral-400 flex items-center justify-center md:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5" style={{ color: buttonColor }} /> {shopAddress}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase">Order Options</h4>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <button
                onClick={() => initiateDeliveryOrder('General Delivery Order')}
                className="hover:text-white"
              >
                Home Delivery (Jhenaidah Sadar Only)
              </button>
              <button onClick={() => scrollToSection('menu-section')} className="hover:text-white">
                Takeaway Pickup
              </button>
              <button
                onClick={() => scrollToSection('location-section')}
                className="hover:text-white"
              >
                Dine-In Restaurant
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase">Contact</h4>
            <p className="text-xs text-neutral-400 flex items-center justify-center md:justify-start gap-1">
              <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} /> WhatsApp: {whatsappNumber}
            </p>
            <p className="text-[11px] text-neutral-500 pt-2">
              © {new Date().getFullYear()} {shopName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* LOCATION POPUP */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            {locationStatus === 'prompt' && (
              <>
                <div className="w-14 h-14 bg-red-100 text-[#CC0000] rounded-full flex items-center justify-center mx-auto">
                  <Navigation className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-neutral-900">Delivery Location Check</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Delivery is only available inside <strong>Jhenaidah Sadar</strong>. We need your
                  location to confirm. Allow Location?
                </p>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={handleAllowLocation}
                    style={{ backgroundColor: buttonColor }}
                    className="w-full min-h-[48px] text-white font-black text-sm rounded-xl shadow"
                  >
                    Allow Location
                  </button>
                  <button
                    onClick={() => openWhatsAppOrder('TAKEAWAY')}
                    className="w-full min-h-[48px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-sm rounded-xl"
                  >
                    Takeaway Instead
                  </button>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="w-full py-2 text-xs text-neutral-500 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {locationStatus === 'checking' && (
              <div className="py-6 space-y-3">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-neutral-700">
                  Checking your Jhenaidah Sadar location...
                </p>
              </div>
            )}

            {locationStatus === 'inside' && (
              <>
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <p className="text-sm font-bold text-emerald-800">
                    Great! You are inside Jhenaidah Sadar. Your delivery is available.
                  </p>
                  {distanceKm !== null && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Distance from Sadar Center: {distanceKm} km
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openWhatsAppOrder('DELIVERY', customerMapsLink)}
                  className="w-full min-h-[50px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg"
                >
                  Confirm & Order on WhatsApp
                </button>
              </>
            )}

            {locationStatus === 'outside' && (
              <>
                <div className="w-14 h-14 bg-red-100 text-[#CC0000] rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                  <p className="text-sm font-bold text-red-800">
                    Sorry! We currently deliver only inside Jhenaidah Sadar. You are outside our
                    delivery area.
                  </p>
                  {distanceKm !== null && (
                    <p className="text-xs text-red-600 mt-1">
                      Your distance: {distanceKm} km (Max 6 km allowed)
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    style={{ backgroundColor: buttonColor }}
                    onClick={() => openWhatsAppOrder('TAKEAWAY')}
                    className="w-full min-h-[48px] text-white font-black text-sm rounded-xl shadow"
                  >
                    Order as TAKEAWAY
                  </button>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="w-full min-h-[48px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-sm rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {locationStatus === 'denied' && (
              <>
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-neutral-800">
                  Location is needed to confirm delivery. You can order as Takeaway or please allow
                  location.
                </p>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={handleAllowLocation}
                    style={{ backgroundColor: buttonColor }}
                    className="w-full min-h-[48px] text-white font-bold text-sm rounded-xl"
                  >
                    Try Allow Location Again
                  </button>
                  <button
                    onClick={() => openWhatsAppOrder('TAKEAWAY')}
                    className="w-full min-h-[48px] bg-neutral-900 text-white font-bold text-sm rounded-xl"
                  >
                    Order as TAKEAWAY
                  </button>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="w-full py-2 text-xs text-neutral-500 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
