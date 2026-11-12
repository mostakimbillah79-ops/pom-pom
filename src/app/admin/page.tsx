'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChefHat,
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  Wallet,
  UtensilsCrossed,
  Settings,
  ShoppingBag,
  Lock,
  Palette,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [pinInput, setPinInput] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const role = localStorage.getItem('pompom_user_role')
    if (role === 'admin') {
      setIsAuthorized(true)
    }
  }, [])

  function handleDirectPinLogin(e: React.FormEvent) {
    e.preventDefault()
    const savedAdminPin = localStorage.getItem('pompom_admin_pin') || '1234'
    if (pinInput.trim() === savedAdminPin) {
      localStorage.setItem('pompom_user_role', 'admin')
      setIsAuthorized(true)
      setError('')
    } else {
      setError('ভুল অ্যাডমিন পিন! সঠিক পিন দিন।')
    }
  }

  // Only shows if someone directly visits /admin without logging in from Navbar
  if (!isAuthorized) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-[#CC0000] rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-neutral-900">অ্যাডমিন ড্যাশবোর্ড লগইন</h1>
          <p className="text-xs text-neutral-500">আপনার অ্যাডমিন পিন কোড দিয়ে প্রবেশ করুন</p>
          <form onSubmit={handleDirectPinLogin} className="space-y-3">
            <input
              type="password"
              placeholder="অ্যাডমিন পিন দিন..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full p-3 border-2 rounded-xl text-center font-mono text-lg focus:outline-none focus:border-red-600"
              autoFocus
            />
            {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-[#CC0000] text-white font-black rounded-xl text-sm shadow"
            >
              প্রবেশ করুন
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            এখান থেকে ওয়েবসাইটের ডিজাইন, ছবি, মেনু, স্টাফ এবং সেটিংস সবকিছু এডিট করুন
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#CC0000] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow"
        >
          <Palette className="w-4 h-4" />
          <span>সাইট ডিজাইন, ছবি ও পিন এডিট করুন</span>
        </Link>
      </div>

      {/* Main Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/settings"
          className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-2xl shadow-md space-y-2 hover:-translate-y-0.5 transition-transform"
        >
          <Settings className="w-8 h-8 text-[#FFD700]" />
          <h2 className="text-lg font-black">সাইট ডিজাইন, ছবি ও সেটিংস</h2>
          <p className="text-xs text-neutral-300">
            হোমপেজের মেইন ছবি, ব্যানার, কালার, নাম, হোয়াটসঅ্যাপ, রিকভারি ইমেইল ও পিন পরিবর্তন করুন।
          </p>
        </Link>

        <Link
          href="/admin/menu"
          className="bg-gradient-to-br from-[#CC0000] to-red-800 text-white p-6 rounded-2xl shadow-md space-y-2 hover:-translate-y-0.5 transition-transform"
        >
          <UtensilsCrossed className="w-8 h-8 text-[#FFD700]" />
          <h2 className="text-lg font-black">মেনু ও খাবারের ছবি ম্যানেজ</h2>
          <p className="text-xs text-red-100">
            নতুন খাবার যোগ করুন, দাম বদলান এবং প্রতিটি মেনু কার্ডের ছবি আপলোড/পরিবর্তন করুন।
          </p>
        </Link>

        <Link
          href="/kitchen"
          className="bg-amber-600 text-white p-6 rounded-2xl shadow-md space-y-2 hover:-translate-y-0.5 transition-transform"
        >
          <ChefHat className="w-8 h-8 text-white" />
          <h2 className="text-lg font-black">কিচেন ডিসপ্লে (Live KOT)</h2>
          <p className="text-xs text-amber-100">
            লাইভ অর্ডারগুলো দেখুন এবং রান্নার স্ট্যাটাস আপডেট করুন।
          </p>
        </Link>

        <Link
          href="/admin/pos"
          className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-500"
        >
          <Receipt className="w-7 h-7 text-[#CC0000]" />
          <div>
            <h3 className="font-bold text-neutral-900">POS ও বিলিং</h3>
            <p className="text-xs text-neutral-500">কাস্টমার বিল ও রিসিট তৈরি করুন</p>
          </div>
        </Link>

        <Link
          href="/admin/employees"
          className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-500"
        >
          <Users className="w-7 h-7 text-[#CC0000]" />
          <div>
            <h3 className="font-bold text-neutral-900">স্টাফ তালিকা</h3>
            <p className="text-xs text-neutral-500">কর্মচারীদের তথ্য ও বেতন</p>
          </div>
        </Link>

        <Link
          href="/admin/stock"
          className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-500"
        >
          <Package className="w-7 h-7 text-[#CC0000]" />
          <div>
            <h3 className="font-bold text-neutral-900">স্টক ও ক্রয়মূল্য</h3>
            <p className="text-xs text-neutral-500">কাঁচামালের স্টক হিসাব</p>
          </div>
        </Link>

        <Link
          href="/admin/expenses"
          className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-500"
        >
          <Wallet className="w-7 h-7 text-[#CC0000]" />
          <div>
            <h3 className="font-bold text-neutral-900">খরচ ও বেতন</h3>
            <p className="text-xs text-neutral-500">দৈনিক খরচের হিসাব রাখুন</p>
          </div>
        </Link>

        <Link
          href="/admin/tables"
          className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-500"
        >
          <ShoppingBag className="w-7 h-7 text-[#CC0000]" />
          <div>
            <h3 className="font-bold text-neutral-900">টেবিল ম্যানেজমেন্ট</h3>
            <p className="text-xs text-neutral-500">ডাইন-ইন টেবিল স্ট্যাটাস</p>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-500"
        >
          <LayoutDashboard className="w-7 h-7 text-[#CC0000]" />
          <div>
            <h3 className="font-bold text-neutral-900">পিন ও রিকভারি সেটিংস</h3>
            <p className="text-xs text-neutral-500">অ্যাডমিন ও কিচেন পিন পরিবর্তন</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
