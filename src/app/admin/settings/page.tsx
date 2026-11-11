'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RestaurantSettings } from '@/types'
import { toast } from 'sonner'
import {
  Settings,
  Save,
  Smartphone,
  MapPin,
  Store,
  DollarSign,
  Lock,
  Mail,
  ShieldCheck,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurant_name: 'Pom Pom',
    address: 'Jhenaidah',
    phone: '',
    whatsapp: '',
    tax_rate: '0',
    currency_symbol: '৳',
    admin_pin: '1234',
    kitchen_pin: '2222',
    recovery_email: '',
  })

  const [saving, setSaving] = useState<boolean>(false)
  const [showAdminPin, setShowAdminPin] = useState<boolean>(false)
  const [showKitchenPin, setShowKitchenPin] = useState<boolean>(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data } = await supabase.from('settings').select('*')
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((s) => (map[s.key] = s.value))
        setSettings((prev) => ({
          ...prev,
          restaurant_name: map.restaurant_name || prev.restaurant_name,
          address: map.address || prev.address,
          phone: map.phone || prev.phone,
          whatsapp: map.whatsapp || prev.whatsapp,
          currency_symbol: map.currency_symbol || '৳',
          tax_rate: map.tax_rate || '0',
          admin_pin: map.admin_pin || localStorage.getItem('pompom_admin_pin') || '1234',
          kitchen_pin: map.kitchen_pin || localStorage.getItem('pompom_kitchen_pin') || '2222',
          recovery_email: map.recovery_email || '',
        }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // 1. Save to Supabase settings table
      const entries = Object.entries(settings)
      for (const [key, value] of entries) {
        if (value !== undefined) {
          await supabase.from('settings').upsert({ key, value: String(value) })
        }
      }

      // 2. Also sync to localStorage for offline access
      if (settings.admin_pin) {
        localStorage.setItem('pompom_admin_pin', settings.admin_pin)
      }
      if (settings.kitchen_pin) {
        localStorage.setItem('pompom_kitchen_pin', settings.kitchen_pin)
      }
      if (settings.recovery_email) {
        localStorage.setItem('pompom_recovery_email', settings.recovery_email)
      }
      if (settings.whatsapp) {
        localStorage.setItem('pompom_whatsapp', settings.whatsapp)
      }

      toast.success('রেস্তোরাঁ ও সিকিউরিটি সেটিংস সফলভাবে সংরক্ষিত হয়েছে!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('সেটিংস সেভ করতে সমস্যা: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetAllOrders() {
    if (!confirm('আপনি কি নিশ্চিত সমস্ত টেস্ট অর্ডার ও বিলিং ডাটা মুছে ফ্রেশ করতে চান?')) return
    try {
      await supabase.from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('restaurant_tables').update({ status: 'available' }).neq('id', '00000000-0000-0000-0000-000000000000')
      localStorage.removeItem('pompom_offline_orders')

      toast.success('সমস্ত টেস্ট অর্ডার সফলভাবে রিসেট করা হয়েছে!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি'
      toast.error('রিসেট ব্যর্থ: ' + msg)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#CC0000]" />
          রেস্তোরাঁ সেটিংস ও সিকিউরিটি পাসওয়ার্ড
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          রেস্তোরাঁর মৌলিক তথ্য, মালিক ও স্টাফদের নিজস্ব পিন কোড এবং পিন রিকভারির ইমেইল ও হোয়াটসঅ্যাপ নম্বর সেট করুন
        </p>
      </div>

      {/* Security & PIN Section (Custom PIN & Recovery) */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-700">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
          <h2 className="text-base font-black text-yellow-300">
            লগইন পিন ও সিকিউরিটি সেটিংস (কাস্টম পাসওয়ার্ড)
          </h2>
        </div>
        <p className="text-xs text-neutral-300">
          আপনার পছন্দমতো যেকোনো ৪ বা ৬ ডিজিটের গোপন পিন কোড সেট করুন। পিন ভুলে গেলে নিচে দেওয়া ইমেইল বা হোয়াটসঅ্যাপের মাধ্যমে রিসেট করা যাবে।
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Owner PIN */}
          <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700 space-y-1.5">
            <label className="text-xs font-bold text-yellow-300 flex items-center justify-between">
              <span>👑 মালিক / অ্যাডমিন পিন:</span>
              <button
                type="button"
                onClick={() => setShowAdminPin(!showAdminPin)}
                className="text-neutral-400 hover:text-white"
              >
                {showAdminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </label>
            <input
              type={showAdminPin ? 'text' : 'password'}
              maxLength={8}
              placeholder="আপনার গোপন পিন (যেমন: 7890)"
              value={settings.admin_pin || ''}
              onChange={(e) => setSettings({ ...settings, admin_pin: e.target.value })}
              className="w-full p-2 border border-neutral-600 rounded-lg bg-neutral-900 text-white font-mono font-bold text-base tracking-widest focus:outline-none focus:border-yellow-400"
            />
            <span className="text-[10px] text-neutral-400 block">
              * শুধুমাত্র আপনি সম্পূর্ণ রেসিপি, কস্টিং ও বিক্রির হিসাব দেখতে পারবেন
            </span>
          </div>

          {/* Kitchen Staff PIN */}
          <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700 space-y-1.5">
            <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>👨‍🍳 কিচেন স্টাফ পিন:</span>
              <button
                type="button"
                onClick={() => setShowKitchenPin(!showKitchenPin)}
                className="text-neutral-400 hover:text-white"
              >
                {showKitchenPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </label>
            <input
              type={showKitchenPin ? 'text' : 'password'}
              maxLength={8}
              placeholder="কিচেন পিন (যেমন: 2222)"
              value={settings.kitchen_pin || ''}
              onChange={(e) => setSettings({ ...settings, kitchen_pin: e.target.value })}
              className="w-full p-2 border border-neutral-600 rounded-lg bg-neutral-900 text-white font-mono font-bold text-base tracking-widest focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-neutral-400 block">
              * কিচেন কর্মীরা এই পিন দিয়ে শুধু লাইভ অর্ডার ও স্টক দেখতে পাবে
            </span>
          </div>
        </div>

        {/* PIN Recovery Channels */}
        <div className="pt-2 border-t border-neutral-700 space-y-3">
          <span className="text-xs font-bold text-neutral-200 block">
            🔑 পিন ভুলে গেলে রিকভারির মাধ্যম (ইমেইল ও হোয়াটসঅ্যাপ):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                মালিকের রিকভারি ইমেইল অ্যাড্রেস:
              </label>
              <input
                type="email"
                placeholder="your-email@gmail.com"
                value={settings.recovery_email || ''}
                onChange={(e) => setSettings({ ...settings, recovery_email: e.target.value })}
                className="w-full p-2 text-xs border border-neutral-600 rounded-lg bg-neutral-900 text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1.5 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                মালিকের রিকভারি হোয়াটসঅ্যাপ নম্বর:
              </label>
              <input
                type="text"
                placeholder="88017XXXXXXXX"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full p-2 text-xs border border-neutral-600 rounded-lg bg-neutral-900 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-neutral-800 pb-2 border-b">
          রেস্তোরাঁর মৌলিক তথ্য
        </h3>

        <div>
          <label className="font-bold text-neutral-700 flex items-center gap-1.5 mb-1">
            <Store className="w-4 h-4 text-[#CC0000]" />
            রেস্তোরাঁর নাম:
          </label>
          <input
            type="text"
            value={settings.restaurant_name}
            onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
            className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000] font-bold text-sm"
          />
        </div>

        <div>
          <label className="font-bold text-neutral-700 flex items-center gap-1.5 mb-1">
            <MapPin className="w-4 h-4 text-neutral-500" />
            ঠিকানা / লোকেশন:
          </label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-neutral-700 flex items-center gap-1.5 mb-1">
              <Smartphone className="w-4 h-4 text-neutral-500" />
              দোকানের ফোন নম্বর:
            </label>
            <input
              type="text"
              placeholder="017xxxxxxxx"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full p-2.5 border rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-neutral-500" />
              কারেন্সি সিম্বল:
            </label>
            <input
              type="text"
              value={settings.currency_symbol}
              onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
              className="w-full p-2.5 border rounded-lg focus:outline-none font-bold"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-[#CC0000] hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস ও নতুন পিন কোড সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Data Reset */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>ডেঞ্জার জোন: টেস্ট ডাটা ও অর্ডার রিসেট</span>
        </div>
        <p className="text-neutral-600">
          আপনি যখন আসল ব্যবসা শুরু করবেন, তখন অতীতের সব টেস্ট অর্ডার, কাস্টমার তথ্য ও টোকেন নম্বরগুলো ১ ক্লিকে মুছে একদম ফ্রেশ করে নিতে পারেন।
        </p>
        <button
          onClick={handleResetAllOrders}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          সমস্ত টেস্ট অর্ডার ও বিল রিসেট করুন
        </button>
      </div>
    </div>
  )
}
