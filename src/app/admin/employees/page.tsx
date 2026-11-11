'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Employee } from '@/types'
import { toast } from 'sonner'
import { Users, Plus, Edit, Trash2, Phone, Briefcase, X } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [role, setRole] = useState<string>('বাবুর্চি (Cook)')
  const [salary, setSalary] = useState<string>('0')

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('employees').select('*').order('name')
      if (error) throw error
      if (data) setEmployees(data)
    } catch (err: any) {
      toast.error('কর্মচারী তালিকা লোড হয়নি')
    } finally {
      setLoading(false)
    }
  }

  function openModal(emp?: Employee) {
    if (emp) {
      setEditingEmp(emp)
      setName(emp.name)
      setPhone(emp.phone || '')
      setRole(emp.role || 'বাবুর্চি (Cook)')
      setSalary(String(emp.salary || 0))
    } else {
      setEditingEmp(null)
      setName('')
      setPhone('')
      setRole('বাবুর্চি (Cook)')
      setSalary('0')
    }
    setIsModalOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('নাম আবশ্যক')
      return
    }

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        role: role.trim() || null,
        salary: Number(salary) || 0,
      }

      if (editingEmp) {
        await supabase.from('employees').update(payload).eq('id', editingEmp.id)
        toast.success('কর্মচারীর তথ্য আপডেট হয়েছে')
      } else {
        await supabase.from('employees').insert(payload)
        toast.success('নতুন কর্মচারী যোগ হয়েছে')
      }

      setIsModalOpen(false)
      fetchEmployees()
    } catch (err: any) {
      toast.error('সংরক্ষণ ব্যর্থ: ' + err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('আপনি কি নিশ্চিত?')) return
    try {
      await supabase.from('employees').delete().eq('id', id)
      toast.success('কর্মচারী মুছে ফেলা হয়েছে')
      fetchEmployees()
    } catch (err: any) {
      toast.error('মুছতে সমস্যা: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#CC0000]" />
            কর্মচারী ও স্টাফ ম্যানেজমেন্ট
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            রেস্তোরাঁর বাবুর্চি, ওয়েটার ও কর্মচারীদের তালিকা এবং মাসিক বেতন নির্ধারণ
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          + নতুন কর্মচারী
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-neutral-400">লোড হচ্ছে...</div>
        ) : employees.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-neutral-400 bg-white rounded-xl border">
            বর্তমানে কোনো কর্মচারী যুক্ত করা হয়নি
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-neutral-900">{emp.name}</h3>
                  <span className="bg-red-100 text-[#CC0000] text-[10px] font-bold px-2 py-0.5 rounded">
                    {emp.role}
                  </span>
                </div>
                {emp.phone && (
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {emp.phone}
                  </p>
                )}
                <p className="text-xs text-neutral-700 font-semibold pt-1">
                  মাসিক বেতন: <span className="font-black text-emerald-700">৳ {emp.salary}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t">
                <button
                  onClick={() => openModal(emp)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b">
              <h2 className="font-bold text-sm text-neutral-900">
                {editingEmp ? 'কর্মচারী তথ্য এডিট' : 'নতুন কর্মচারী যোগ'}
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div>
              <label className="font-semibold text-neutral-700">কর্মচারীর পূর্ণ নাম:</label>
              <input
                type="text"
                placeholder="যেমন: সোহাগ হোসেন"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700">মোবাইল নম্বর:</label>
              <input
                type="text"
                placeholder="017xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700">পদবী / রোল:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
              >
                <option value="প্রধান বাবুর্চি (Head Chef)">প্রধান বাবুর্চি (Head Chef)</option>
                <option value="সহকারী বাবুর্চি (Assistant Cook)">সহকারী বাবুর্চি (Assistant Cook)</option>
                <option value="ওয়েটার (Waiter)">ওয়েটার (Waiter)</option>
                <option value="ক্যাশিয়ার (Cashier)">ক্যাশিয়ার (Cashier)</option>
                <option value="ক্লিনার (Cleaner)">ক্লিনার (Cleaner)</option>
                <option value="ম্যানেজার (Manager)">ম্যানেজার (Manager)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-neutral-700">মাসিক বেতন (টাকা ৳):</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none font-bold"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-1.5 border rounded-lg text-neutral-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-1.5 bg-[#CC0000] text-white font-bold rounded-lg shadow"
              >
                সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
