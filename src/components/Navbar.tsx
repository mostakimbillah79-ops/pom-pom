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

    // Load custom settings for PIN and Recovery
    loadSecuritySettings()
  }, [])

  async function loadSecuritySettings() {
    try {
      const { data } = await supabase.from('settings').select('*')
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((s) => {
          if (s.key && s.value) map[s.key] = s.value
        })

        if (map.admin_pin) localStorage.setItem('pompom_admin_pin', map.admin_pin)
        if (map.kitchen_pin) localStorage.setItem('pompom_kitchen_pin', map.kitchen_pin)
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
      // offline fallback
      setOwnerWhatsapp(localStorage.getItem('pompom_whatsapp') || '')
      setOwnerEmail(localStorage.getItem('pompom_recovery_email') || '')
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
        setPinError('ভুল মালিক পিন! সঠিক পিন কোড দিন (ভুলে গেলে "পিন ভুলে গেছেন?" এ ক্লিক করুন)')
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

  // Generate 4-digit OTP for PIN Recovery
  function handleSendOtp() {
    setRecoveryError('')
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    setGeneratedOtp(otp)

    if (recoveryMethod === 'whatsapp') {
      const phone = ownerWhatsapp || localStorage.getItem('pompom_whatsapp') || '8801700000000'
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      const msg = `🔐 *POM POM রেস্তোরাঁ সিকিউরিটি ভেরিফিকেশন কোড:* ${otp}\nএই কোডটি দিয়ে আপনার ${loginRole === 'admin' ? 'মালিক পিন' : 'কিচেন পিন'} পরিবর্তন করুন।`
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')
      setRecoveryStep('verify')
    } else {
      const email = ownerEmail || localStorage.getItem('pompom_recovery_email')
      if (!email) {
        setRecoveryError('কোনো রিকভারি ইমেইল সেটিংসে যুক্ত করা নেই। হোয়াটসঅ্যাপ ব্যবহার করুন।')
        return
      }
      setRecoveryStep('verify')
    }
  }

  async function handleVerifyAndResetPin() {
    setRecoveryError('')
    if (enteredOtp.trim() !== generatedOtp) {
      setRecoveryError('ভুল ভেরিফিকেশন কোড! হোয়াটসঅ্যাপে পাঠানো সঠিক ৪ ডিজিট দিন।')
      return
    }

    if (!newPin.trim() || newPin.length < 4) {
      setRecoveryError('নতুন পিন কোড কমপক্ষে ৪ ডিজিট হতে হবে।')
      return
    }

    try {
      const key = loginRole === 'admin' ? 'admin_pin' : 'kitchen_pin'
      await supabase.from('settings').upsert({ key, value: newPin.trim() })

      if (loginRole === 'admin') {
        localStorage.setItem('pompom_admin_pin', newPin.trim())
      } else {
        localStorage.setItem('pompom_kitchen_pin', newPin.trim())
      }

      setIsForgotModalOpen(false)
      setRecoveryStep('request')
      setPinInput(newPin.trim())
      setRecoveryError('')
      alert('অভিনন্দন! আপনার নতুন পিন কোড সফলভাবে সেট হয়েছে। এবার লগইন করুন।')
    } catch {
      if (loginRole === 'admin') {
        localStorage.setItem('pompom_admin_pin', newPin.trim())
      } else {
        localStorage.setItem('pompom_kitchen_pin', newPin.trim())
      }
      setIsForgotModalOpen(false)
      setRecoveryStep('request')
      setPinInput(newPin.trim())
      alert('নতুন পিন কোড লোকাল মেমোরিতে সফলভাবে সেট হয়েছে!')
    }
  }

  const isAdmin = userRole === 'admin'
  const isKitchen = userRole === 'kitchen'

  const adminLinks = [
    { href: '/admin', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { href: '/admin/pos', label: 'POS ও বিলিং', icon: Receipt },
    { href: '/kitchen', label: 'কিচেন ডিসপ্লে (KOT)', icon: ChefHat },
    { href: '/admin/menu', label: 'গোপন রেসিপি ও মেনু', icon: UtensilsCrossed },
    { href: '/admin/stock', label: 'স্টক ও ক্রয়মূল্য', icon: Package },
    { href: '/admin/expenses', label: 'খরচ ও বেতন', icon: Wallet },
    { href: '/admin/tables', label: 'টেবিল', icon: ShoppingBag },
    { href: '/admin/employees', label: 'স্টাফ তালিকা', icon: Users },
    { href: '/admin/settings', label: 'সেটিংস ও পিন', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#CC0000] text-white shadow-md border-b-4 border-[#FFD700]">
      {/* Brand Top Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-white p-1 rounded-full shadow-inner flex items-center justify-center h-12 w-12 border-2 border-[#FFD700]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Pom Pom Logo" className="h-8 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-wider text-[#FFD700] drop-shadow-sm">
                POM POM
              </span>
              <span className="text-[10px] bg-[#FFD700] text-[#CC0000] font-black px-1.5 py-0.5 rounded uppercase">
                Jhenaidah
              </span>
            </div>
            <p className="text-[10px] text-yellow-100 font-medium tracking-wide flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#FFD700] inline" />
              Passion of Making • Promise of More
            </p>
          </div>
        </Link>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Customer Menu Link */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold bg-[#FFD700] text-[#CC0000] shadow transition-transform hover:scale-105"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>খাবারের মেনু (Menu)</span>
          </Link>

          {/* Kitchen Display Link (Staff or Admin) */}
          {(isKitchen || isAdmin) && (
            <Link
              href="/kitchen"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>কিচেন ডিসপ্লে</span>
            </Link>
          )}

          {/* Admin Dashboard Link (Strictly Owner Only) */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-black/40 hover:bg-black/60 text-yellow-300 rounded-lg text-xs font-bold border border-yellow-400/40"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>মালিক ড্যাশবোর্ড</span>
            </Link>
          )}

          {/* Login / Logout Controls */}
          {userRole !== 'none' ? (
            <button
              onClick={handleLogout}
              title="লগআউট"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950 hover:bg-black text-red-200 hover:text-white rounded-lg text-xs font-semibold"
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
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Lock className="w-3 h-3 text-yellow-300" />
              <span>স্টাফ লগইন</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin-Only Sub Navigation Bar */}
      {isAdmin && pathname.startsWith('/admin') && (
        <div className="bg-red-950/95 border-t border-red-700/60 px-4 py-1.5 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-yellow-300 uppercase px-2 py-0.5 bg-red-900 rounded mr-1 flex items-center gap-1 shrink-0">
              <KeyRound className="w-3 h-3 text-yellow-300" />
              মালিকের কন্ট্রোল:
            </span>
            {adminLinks.map((item) => {
              const Icon = item.icon
              const isSubActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSubActive
                      ? 'bg-[#FFD700] text-[#CC0000] font-bold shadow-sm'
                      : 'text-red-100 hover:bg-red-800/80 hover:text-white'
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

      {/* Role-based Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center text-neutral-900">
            <div className="w-12 h-12 bg-red-100 text-[#CC0000] rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-neutral-900">
                লগইন নির্বাচন করুন
              </h3>
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
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  loginRole === 'admin'
                    ? 'bg-[#CC0000] text-white shadow'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                মালিক / অ্যাডমিন
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
                className="w-full text-center text-lg tracking-widest font-mono p-2.5 border-2 border-neutral-300 rounded-xl focus:outline-none focus:border-[#CC0000]"
                autoFocus
              />
              {pinError && <p className="text-[11px] text-red-600 font-bold">{pinError}</p>}
            </div>

            {/* Forgot PIN Action Link */}
            <div className="flex justify-between items-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false)
                  setIsForgotModalOpen(true)
                }}
                className="text-neutral-500 hover:text-[#CC0000] font-semibold flex items-center gap-1"
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
                className="flex-1 py-2 rounded-xl border text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleLogin}
                className="flex-1 py-2 rounded-xl bg-[#CC0000] hover:bg-red-700 text-white font-bold text-xs shadow"
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
                {loginRole === 'admin' ? 'মালিক পিন রিসেট' : 'কিচেন পিন রিসেট'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                হোয়াটসঅ্যাপ বা ইমেইলের মাধ্যমে সিক্রেট ওটিপি কোড দিয়ে নতুন পিন সেট করুন
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
                      📱 আপনার রেজিস্টার্ড হোয়াটসঅ্যাপে (<strong>{ownerWhatsapp || 'সেটিংসে দেওয়া নম্বর'}</strong>) একটি ৪ ডিজিটের ভেরিফিকেশন কোড পাঠানো হবে।
                    </p>
                  ) : (
                    <p>
                      ✉️ আপনার রেজিস্টার্ড ইমেইলে (<strong>{ownerEmail || 'সেটিংসে দেওয়া ইমেইল'}</strong>) কোড পাঠানো হবে।
                    </p>
                  )}
                </div>

                {recoveryError && <p className="text-red-600 font-bold text-center">{recoveryError}</p>}

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
                  ✅ আপনার {recoveryMethod === 'whatsapp' ? 'হোয়াটসঅ্যাপে' : 'ইমেইলে'} ৪ ডিজিটের একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।
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

                {recoveryError && <p className="text-red-600 font-bold text-center">{recoveryError}</p>}

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
                    className="flex-1 py-2 bg-[#CC0000] hover:bg-red-700 text-white font-bold rounded-xl shadow"
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
