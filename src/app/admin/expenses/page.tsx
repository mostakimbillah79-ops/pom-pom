'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Expense, Employee } from '@/types'
import { toast } from 'sonner'
import {
  Wallet,
  Plus,
  Zap,
  Users,
  Truck,
  Building,
  Wrench,
  Trash2,
  Calendar,
  X,
} from 'lucide-react'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [type, setType] = useState<Expense['type']>('electricity')
  const [description, setDescription] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  useEffect(() => {
    fetchExpenses()
  }, [])

  async function fetchExpenses() {
    setLoading(true)
    try {
      const [expRes, empRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*, employee:employees(*)')
          .order('expense_date', { ascending: false }),
        supabase.from('employees').select('*').order('name'),
      ])

      if (expRes.data) setExpenses(expRes.data)
      if (empRes.data) setEmployees(empRes.data)
    } catch (err: any) {
      console.error(err)
      toast.error('খরচের তথ্য লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddExpense() {
    if (!amount || Number(amount) <= 0) {
      toast.error('খরচের পরিমাণ উল্লেখ করুন')
      return
    }

    try {
      const { error } = await supabase.from('expenses').insert({
        type,
        description: description.trim() || null,
        amount: Number(amount),
        expense_date: expenseDate,
        employee_id: type === 'salary' && selectedEmployeeId ? selectedEmployeeId : null,
      })

      if (error) throw error

      toast.success('খরচ সফলভাবে যুক্ত হয়েছে!')
      setIsModalOpen(false)
      setDescription('')
      setAmount('')
      fetchExpenses()
    } catch (err: any) {
      toast.error('যোগ করতে সমস্যা: ' + err.message)
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('আপনি কি এই খরচের রেকর্ডটি মুছতে চান?')) return
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      toast.success('খরচের রেকর্ড মুছে ফেলা হয়েছে')
      fetchExpenses()
    } catch (err: any) {
      toast.error('মুছতে সমস্যা: ' + err.message)
    }
  }

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#CC0000]" />
            খরচ ও বেতন ট্র্যাকার (Expense Manager)
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            কর্মচারীদের মাসিক বেতন, বিদ্যুৎ বিল, দোকান ভাড়া, ডেলিভারি খরচ ও আনুসঙ্গিক ব্যয়ের হিসাব
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          + নতুন খরচ এন্ট্রি
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs text-neutral-500 font-bold">সর্বমোট খরচ</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">৳ {totalExpense}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs text-neutral-500 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            বিদ্যুৎ বিল
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            ৳{' '}
            {expenses
              .filter((e) => e.type === 'electricity')
              .reduce((s, e) => s + Number(e.amount), 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs text-neutral-500 font-bold flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            কর্মচারীদের বেতন
          </p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            ৳{' '}
            {expenses
              .filter((e) => e.type === 'salary')
              .reduce((s, e) => s + Number(e.amount), 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs text-neutral-500 font-bold flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-emerald-500" />
            ডেলিভারি খরচ
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ৳{' '}
            {expenses
              .filter((e) => e.type === 'delivery')
              .reduce((s, e) => s + Number(e.amount), 0)}
          </p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
              <tr>
                <th className="p-3">তারিখ</th>
                <th className="p-3">খরচের খাত</th>
                <th className="p-3">বিবরণ</th>
                <th className="p-3">টাকার পরিমাণ</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-400">
                    কোনো খরচের রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-mono text-neutral-600">
                      {new Date(exp.expense_date).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                        {exp.type === 'salary'
                          ? 'কর্মচারী বেতন'
                          : exp.type === 'electricity'
                          ? 'বিদ্যুৎ বিল'
                          : exp.type === 'delivery'
                          ? 'ডেলিভারি খরচ'
                          : exp.type === 'rent'
                          ? 'দোকান ভাড়া'
                          : 'অন্যান্য খরচ'}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-700">
                      {exp.description || (exp.employee ? `স্টাফ: ${exp.employee.name}` : '-')}
                    </td>
                    <td className="p-3 font-black text-sm text-[#CC0000]">
                      ৳ {exp.amount}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded hover:bg-neutral-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h2 className="font-black text-base text-neutral-900">নতুন খরচ এন্ট্রি</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700">খরচের ধরণ:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                >
                  <option value="electricity">⚡ বিদ্যুৎ বিল</option>
                  <option value="salary">👨‍🍳 কর্মচারীর বেতন</option>
                  <option value="delivery">🚚 মাল আনার ডেলিভারি খরচ</option>
                  <option value="rent">🏢 দোকান ভাড়া</option>
                  <option value="maintenance">🔧 মেরামত ও রক্ষণাবেক্ষণ</option>
                  <option value="other">📦 অন্যান্য খরচ</option>
                </select>
              </div>

              {type === 'salary' && (
                <div>
                  <label className="font-bold text-neutral-700">কর্মচারী নির্বাচন করুন:</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="">কর্মচারী সিলেক্ট করুন</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role || 'স্টাফ'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-neutral-700">টাকার পরিমাণ (৳):</label>
                <input
                  type="number"
                  placeholder="যেমন: ১৫০০"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">খরচের তারিখ:</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">বিবরণ / নোট:</label>
                <input
                  type="text"
                  placeholder="যেমন: নভেম্বর মাসের বিদ্যুৎ বিল"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 border rounded-lg text-neutral-600 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 py-2 bg-[#CC0000] text-white font-bold text-xs rounded-lg shadow"
              >
                যুক্ত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
