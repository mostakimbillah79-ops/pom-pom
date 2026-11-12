
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Lock,
  ChefHat,
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  Wallet,
  UtensilsCrossed,
  Settings,
  ShoppingBag,
} from 'lucide-react'

export default function SecretAdminPage() {
  const [passwordInput, setPasswordInput] = useState<string>('')
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    const saved = sessionStorage.getItem('pompom_secret_admin')
    if (saved === 'true') {
      setIsUnlocked(true)
    }
  }, [])

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === 'pompoms123') {
      sessionStorage.setItem('pompom_secret_admin', 'true')
      setIsUnlocked(true)
      setErrorMsg('')
    } else {
      setErrorMsg('Wrong Password')
    }
  }

  // 1. Password Gate Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-neutral-950">
        <div className="bg-white rounded-3xl max-w-sm w-full p-7 shadow-2xl space-y-5 text-center">
          <div className="w-14 h-14 bg-red-100 text-[#CC0000] rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-neutral-900">Admin Access</h1>
            <p className="text-xs text-neutral-500">Enter admin password to continue</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full min-h-[48px] px-4 border-2 border-neutral-300 rounded-xl text-center font-mono text-base focus:outline-none focus:border-[#CC0000]"
              autoFocus
            />

            {errorMsg && (
              <p className="text-sm font-bold text-red-600 bg-red-50 py-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#CC0000] hover:bg-red-700 text-white font-black rounded-xl text-sm shadow-lg"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 2. Unlocked Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">
            POM POM Admin Control Center
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Secret Management Panel • Jhenaidah Sadar
          </p>
        </div>
      </div>

      {/* Main 3 Required Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* a) Kitchen Display / Live Orders */}
        <Link
          href="/kitchen"
          className="bg-amber-600 hover:bg-amber-700 text-white p-6 rounded-2xl shadow-lg space-y-3 transition-transform hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ChefHat className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black">Kitchen Display / Live Orders</h2>
          <p className="text-xs text-amber-100">
            লাইভ অর্ডার (KOT) দেখুন এবং কিচেন স্ট্যাটাস আপডেট করুন।
          </p>
        </Link>

        {/* b) Owner Dashboard */}
        <Link
          href="/admin/pos"
          className="bg-[#CC0000] hover:bg-red-700 text-white p-6 rounded-2xl shadow-lg space-y-3 transition-transform hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black">Owner Dashboard & POS</h2>
          <p className="text-xs text-red-100">
            বিক্রয় হিসাব, বিলিং (POS) এবং ব্যবসার সম্পূর্ণ রিপোর্ট দেখুন।
          </p>
        </Link>

        {/* c) Staff Section */}
        <Link
          href="/admin/employees"
          className="bg-neutral-900 hover:bg-black text-white p-6 rounded-2xl shadow-lg space-y-3 transition-transform hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-[#FFD700]" />
          </div>
          <h2 className="text-xl font-black">Staff Section</h2>
          <p className="text-xs text-neutral-300">
            কর্মচারীদের তালিকা, ডিউটি এবং বেতন ব্যবস্থাপনা করুন।
          </p>
        </Link>
      </div>

      {/* Quick Access to All Existing Admin Modules */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <h3 className="font-black text-base text-neutral-800">All Management Modules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/pos"
            className="p-4 rounded-xl border hover:border-[#CC0000] flex items-center gap-2.5 text-sm font-bold text-neutral-800"
          >
            <Receipt className="w-5 h-5 text-[#CC0000]" /> POS ও বিলিং
          </Link>
          <Link
            href="/admin/menu"
            className="p-4 rounded-xl border hover:border-[#CC0000] flex items-center gap-2.5 text-sm font-bold text-neutral-800"
          >
            <UtensilsCrossed className="w-5 h-5 text-[#CC0000]" /> মেনু ও রেসিপি
          </Link>
          <Link
            href="/admin/stock"
            className="p-4 rounded-xl border hover:border-[#CC0000] flex items-center gap-2.5 text-sm font-bold text-neutral-800"
          >
            <Package className="w-5 h-5 text-[#CC0000]" /> স্টক ও ক্রয়মূল্য
          </Link>
          <Link
            href="/admin/expenses"
            className="p-4 rounded-xl border hover:border-[#CC0000] flex items-center gap-2.5 text-sm font-bold text-neutral-800"
          >
            <Wallet className="w-5 h-5 text-[#CC0000]" /> খরচ ও বেতন
          </Link>
          <Link
            href="/admin/tables"
            className="p-4 rounded-xl border hover:border-[#CC0000] flex items-center gap-2.5 text-sm font-bold text-neutral-800"
          >
            <ShoppingBag className="w-5 h-5 text-[#CC0000]" /> টেবিল ম্যানেজমেন্ট
          </Link>
          <Link
            href="/admin/settings"
            className="p-4 rounded-xl border hover:border-[#CC0000] flex items-center gap-2.5 text-sm font-bold text-neutral-800"
          >
            <Settings className="w-5 h-5 text-[#CC0000]" /> সেটিংস
          </Link>
        </div>
      </div>
    </div>
  )
}
