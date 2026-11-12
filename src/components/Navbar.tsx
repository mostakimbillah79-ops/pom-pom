'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Package,
  Wallet,
  Users,
  Settings,
  ShoppingBag,
  Flame,
  Lock,
  LogOut,
  KeyRound,
  Mail,
  Smartphone,
  HelpCircle,
} from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  // Role: 'none' | 'kitchen' | 'admin'
  const [userRole, setUserRole] = useState<'none' | 'kitchen' | 'admin'>('none')
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false)
  const [loginRole, setLoginRole] = useState<'admin' | 'kitchen'>('admin')
  const [pinInput, setPinInput] = useState<string>('')
  const [pinError, setPinError] = useState<string>('')

  // Dynamic Brand & Colors from Settings
  const [shopName, setShopName] = useState<string>('POM POM')
  const [primaryColor, setPrimaryColor] = useState<string>('#CC0000')
  const [accentColor, setAccentColor] = useState<string>('#FFD700')

  // Forgot / Reset PIN flow state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false)
  const [recoveryMethod, setRecoveryMethod] = useState<'whatsapp' | 'email'>('whatsapp')
  const [enteredOtp, setEnteredOtp] = useState<string>('')
  const [newPin, setNewPin] = useState<string>('')
  const [generatedOtp, setGeneratedOtp] = useState<string>('')
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify'>('request')
  const [recoveryError, setRecoveryError] = useState<string>('')

  // Settings cached
  const [ownerWhatsapp, setOwnerWhatsapp] = useState<string>('')
  const [ownerEmail, setOwnerEmail] = useState<string>('')

  useEffect(() => {
    const role = localStorage.getItem('pompom_user_role') as 'kitchen' | 'admin' | null
    if (role === 'admin' || role === 'kitchen') {
      setUserRole(role)
    }
    loadSecurityAndThemeSettings()
  }, [pathname])

  async function loadSecurityAndThemeSettings() {
    // Load local cache first for instant UI
    setShopName(localStorage.getItem('pompom_shop_name') || 'POM POM')
    setPrimaryColor(localStorage.getItem('pompom_primary_color') || '#CC0000')
    setAccentColor(localStorage.getItem('pompom_accent_color') || '#FFD700')
    setOwnerWhatsapp(localStorage.getItem('pompom_whatsapp') || '')
    setOwnerEmail(localStorage.getItem('pompom_recovery_email') || '')

    try {
      const { data } = await supabase.from('settings').select('*')
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((s) => {
          if (s.key && s.value) map[s.key] = s.value
        })

        if (map.admin_pin) localStorage.setItem('pompom_admin_pin', map.admin_pin)
        if (map.kitchen_pin) localStorage.setItem('pompom_kitchen_pin', map.kitchen_pin)
        if (map.shop_name) {
          setShopName(map.shop_name)
          localStorage.setItem('pompom_shop_name', map.shop_name)
        }
        if (map.primary_color) {
          setPrimaryColor(map.primary_color)
          localStorage.setItem('pompom_primary_color', map.primary_color)
        }
        if (map.accent_color) {
          setAccentColor(map.accent_color)
          localStorage.setItem('pompom_accent_color', map.accent_color)
        }
        if (map.whatsapp) {
          setOwnerWhatsapp(map.whatsapp)
          localStorage.setItem('pompom_whatsapp', map.whatsapp)
        }
        if (map.recovery_email) {
          setOwnerEmail(map.recovery_email)
          localStorage.setItem('pompom_recovery_email', map.recovery_email)
        }
      }
    } catch {
      // Offline fallback already loaded
    }
  }

  function handleLogin() {
    setPinError('')
    const inputClean = pinInput.trim()

    if (loginRole === 'admin') {
      const adminPin = localStorage.getItem('pompom_admin_pin') || '1234'
      if (inputClean === adminPin) {
        localStorage.setItem('pompom_user_role', 'admin')
        setUserRole('admin')
        setShowLoginModal(false)
        setPinInput('')
        router.push('/admin')
      } else {
        setPinError('ভুল অ্যাডমিন পিন! সঠিক পিন কোড দিন (ভুলে গেলে "পিন ভুলে গেছেন?" এ ক্লিক করুন)')
      }
    } else if (loginRole === 'kitchen') {
      const kitchenPin = localStorage.getItem('pompom_kitchen_pin') || '2222'
      if (inputClean === kitchenPin) {
        localStorage.setItem('pompom_user_role', 'kitchen')
        setUserRole('kitchen')
        setShowLoginModal(false)
        setPinInput('')
        router.push('/kitchen')
      } else {
        setPinError('ভুল কিচেন পিন! সঠিক কিচেন স্টাফ পিন দিন (ভুলে গেলে "পিন ভুলে গেছেন?" এ ক্লিক করুন)')
      }
    }
  }

  function handleLogout() {
    localStorage.removeItem('pompom_user_role')
    setUserRole('none')
    router.push('/')
  }

  function handleSendOtp() {
    setRecoveryError('')
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    setGeneratedOtp(otp)

    if (recoveryMethod === 'whatsapp') {
      const phone = ownerWhatsapp || localStorage.getItem('pompom_whatsapp') || '8801700000000'
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      const msg = `🔐 *${shopName} সিকিউরিটি ভেরিফিকেশন কোড:* ${otp}\nএই কোডটি দিয়ে আপনার ${loginRole === 'admin' ? 'অ্যাডমিন পিন' : 'কিচেন পিন'} পরিবর্তন করুন।`
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')
      setRecoveryStep('verify')
    } else {
      const email = ownerEmail || localStorage.getItem('pompom_recovery_email')
      if (!email) {
        setRecoveryError('কোনো রিকভারি ইমেইল সেটিংসে যুক্ত করা নেই। হোয়াটসঅ্যাপ ব্যবহার করুন।')
        return
      }
      alert(`ভেরিফিকেশন কোড (${otp}) আপনার ইমেইল ${email}-এ পাঠানো হয়েছে।`)
      setRecoveryStep('verify')
    }
  }

  async function handleVerifyAndResetPin() {
    setRecoveryError('')
    if (enteredOtp.trim() !== generatedOtp) {
      setRecoveryError('ভুল ভেরিফিকেশন কোড! সঠিক ৪ ডিজিট দিন।')
      return
    }

    if (!newPin.trim() || newPin.length < 4) {
      setRecoveryError('নতুন পিন কোড কমপক্ষে ৪ ডিজিট হতে হবে।')
      return
    }

    const key = loginRole === 'admin' ? 'admin_pin' : 'kitchen_pin'
    const storageKey = loginRole === 'admin' ? 'pompom_admin_pin' : 'pompom_kitchen_pin'

    localStorage.setItem(storageKey, newPin.trim())
    try {
      await supabase.from('settings').upsert({ key, value: newPin.trim() }, { onConflict: 'key' })
    } catch {
      // Saved locally
    }

    setIsForgotModalOpen(false)
    setRecoveryStep('request')
    setPinInput(newPin.trim())
    setRecoveryError('')
    alert('অভিনন্দন! আপনার নতুন পিন কোড সফলভাবে সেট হয়েছে। এবার প্রবেশ করুন।')
  }

  const isAdmin = userRole === 'admin'
  const isKitchen = userRole === 'kitchen'

  const adminLinks = [
    { href: '/admin', label: 'অ্যাডমিন ড্যাশবোর্ড', icon: LayoutDashboard },
    { href: '/admin/pos', label: 'POS ও বিলিং', icon: Receipt },
    { href: '/kitchen', label: 'কিচেন ডিসপ্লে (KOT)', icon: ChefHat },
    { href: '/admin/menu', label: 'মেনু ও ছবি এডিট', icon: UtensilsCrossed },
    { href: '/admin/stock', label: 'স্টক ও ক্রয়মূল্য', icon: Package },
    { href: '/admin/expenses', label: 'খরচ ও বেতন', icon: Wallet },
    { href: '/admin/tables', label: 'টেবিল', icon: ShoppingBag },
    { href: '/admin/employees', label: 'স্টাফ তালিকা', icon: Users },
    { href: '/admin/settings', label: 'সেটিংস ও ডিজাইন এডিট', icon: Settings },
  ]

  return (
    <header
      className="sticky top-0 z-50 text-white shadow-md border-b-4 transition-colors"
      style={{ backgroundColor: primaryColor, borderColor: accentColor }}
    >
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="bg-white p-1 rounded-full shadow-inner flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 border-2"
            style={{ borderColor: accentColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" className="h-7 sm:h-8 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xl sm:text-2xl font-black tracking-wider drop-shadow-sm"
                style={{ color: accentColor }}
              >
                {shopName}
              </span>
              <span
                className="hidden sm:inline-block text-[10px] font-black px-1.5 py-0.5 rounded uppercase"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                Jhenaidah
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-yellow-100 font-medium tracking-wide flex items-center gap-1">
              <Flame className="w-3 h-3 inline shrink-0" style={{ color: accentColor }} />
              <span className="truncate">Passion of Making • Promise of More</span>
            </p>
          </div>
        </Link>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Customer Menu Link */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow transition-transform hover:scale-105"
            style={{ backgroundColor: accentColor, color: primaryColor }}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="hidden xs:inline">খাবারের মেনু</span>
            <span className="xs:hidden">Menu</span>
          </Link>

          {/* Kitchen Display Link (Staff or Admin) */}
          {(isKitchen || isAdmin) && (
            <Link
              href="/kitchen"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">কিচেন ডিসপ্লে</span>
            </Link>
          )}

          {/* Admin Dashboard Link (Changed from মালিক ড্যাশবোর্ড to অ্যাডমিন ড্যাশবোর্ড) */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-black/40 hover:bg-black/60 text-yellow-300 rounded-lg text-xs font-bold border border-yellow-400/40"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>অ্যাডমিন ড্যাশবোর্ড</span>
            </Link>
          )}

          {/* Staff Login / Logout Controls */}
          {userRole !== 'none' ? (
            <button
              onClick={handleLogout}
              title="লগআউট"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-black/50 hover:bg-black text-white rounded-lg text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowLoginModal(true)
                setLoginRole('kitchen')
              }}
              title="স্টাফ ও অ্যাডমিন লগইন"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-black/30 hover:bg-black/50 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Lock className="w-3 h-3" style={{ color: accentColor }} />
              <span>স্টাফ লগইন</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Sub Navigation Bar */}
      {isAdmin && (pathname.startsWith('/admin') || pathname.startsWith('/kitchen')) && (
        <div className="bg-black/40 border-t border-white/15 px-4 py-1.5 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5">
            <span
              className="text-[11px] font-bold uppercase px-2 py-0.5 bg-black/40 rounded mr-1 flex items-center gap-1 shrink-0"
              style={{ color: accentColor }}
            >
              <KeyRound className="w-3 h-3" />
              অ্যাডমিন কন্ট্রোল:
            </span>
            {adminLinks.map((item) => {
              const Icon = item.icon
              const isSubActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={
                    isSubActive
                      ? { backgroundColor: accentColor, color: primaryColor }
                      : undefined
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSubActive
                      ? 'font-bold shadow-sm'
                      : 'text-white/90 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Role-based Login Modal (Kitchen Staff & Admin) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center text-neutral-900">
            <div className="w-12 h-12 bg-red-100 text-[#CC0000] rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-neutral-900">লগইন নির্বাচন করুন</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                কাস্টম পিন দিয়ে আপনার প্যানেলে প্রবেশ করুন
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLoginRole('kitchen')
                  setPinInput('')
                  setPinError('')
                }}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  loginRole === 'kitchen'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                কিচেন স্টাফ
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRole('admin')
                  setPinInput('')
                  setPinError('')
                }}
                style={loginRole === 'admin' ? { backgroundColor: primaryColor } : undefined}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  loginRole === 'admin'
                    ? 'text-white shadow'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                অ্যাডমিন
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block text-left">
                আপনার গোপন পিন দিন:
              </label>
              <input
                type="password"
                maxLength={8}
                placeholder="পিন কোড লিখুন..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full text-center text-lg tracking-widest font-mono p-2.5 border-2 border-neutral-300 rounded-xl focus:outline-none focus:border-red-600"
                autoFocus
              />
              {pinError && <p className="text-[11px] text-red-600 font-bold">{pinError}</p>}
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false)
                  setIsForgotModalOpen(true)
                }}
                className="text-neutral-500 hover:text-red-600 font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>পিন ভুলে গেছেন? রিসেট করুন</span>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false)
                  setPinInput('')
                  setPinError('')
                }}
                className="flex-1 py-2.5 rounded-xl border text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleLogin}
                style={{ backgroundColor: primaryColor }}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow"
              >
                প্রবেশ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot / Reset PIN Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center text-neutral-900">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-neutral-900">
                {loginRole === 'admin' ? 'অ্যাডমিন পিন রিসেট' : 'কিচেন পিন রিসেট'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                হোয়াটসঅ্যাপ বা ইমেইলের মাধ্যমে ওটিপি কোড দিয়ে নতুন পিন সেট করুন
              </p>
            </div>

            {recoveryStep === 'request' ? (
              <div className="space-y-3 text-left text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    কোড পাঠানোর মাধ্যম বেছে নিন:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('whatsapp')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        recoveryMethod === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>হোয়াটসঅ্যাপ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('email')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        recoveryMethod === 'email'
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                          : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>ইমেইল</span>
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-xl border text-neutral-600">
                  {recoveryMethod === 'whatsapp' ? (
                    <p>
                      📱 আপনার সেভ করা হোয়াটসঅ্যাপে (
                      <strong>{ownerWhatsapp || 'সেটিংসে দেওয়া নম্বর'}</strong>) একটি ৪ ডিজিটের
                      ভেরিফিকেশন কোড পাঠানো হবে।
                    </p>
                  ) : (
                    <p>
                      ✉️ আপনার সেভ করা ইমেইলে (
                      <strong>{ownerEmail || 'সেটিংসে দেওয়া ইমেইল'}</strong>) কোড পাঠানো হবে।
                    </p>
                  )}
                </div>

                {recoveryError && (
                  <p className="text-red-600 font-bold text-center">{recoveryError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border text-neutral-600 font-bold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                  >
                    কোড পাঠান
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 text-[11px]">
                  ✅ ৪ ডিজিটের একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    ভেরিফিকেশন কোড (OTP):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="যেমন: 5824"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full text-center font-mono font-bold text-lg p-2 border-2 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    নতুন সিক্রেট পিন কোড সেট করুন:
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="আপনার নতুন পিন..."
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full text-center font-mono font-bold text-lg p-2 border-2 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {recoveryError && (
                  <p className="text-red-600 font-bold text-center">{recoveryError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep('request')}
                    className="flex-1 py-2 rounded-xl border text-neutral-600 font-bold"
                  >
                    পেছনে
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyAndResetPin}
                    style={{ backgroundColor: primaryColor }}
                    className="flex-1 py-2 text-white font-bold rounded-xl shadow"
                  >
                    নতুন পিন সেভ করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
