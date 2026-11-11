'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RestaurantTable } from '@/types'
import { toast } from 'sonner'
import { ShoppingBag, Plus, Trash2, QrCode, Check, X } from 'lucide-react'

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [tableNumber, setTableNumber] = useState<string>('')
  const [seats, setSeats] = useState<string>('4')
  const [floor, setFloor] = useState<string>('Ground')

  useEffect(() => {
    fetchTables()
  }, [])

  async function fetchTables() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number')
      if (error) throw error
      if (data) setTables(data)
    } catch (err: any) {
      toast.error('টেবিল লোড হয়নি')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTable() {
    if (!tableNumber) return
    try {
      await supabase.from('restaurant_tables').insert({
        table_number: Number(tableNumber),
        seats: Number(seats) || 4,
        floor: floor || 'Ground',
        status: 'available',
      })
      toast.success('নতুন টেবিল যুক্ত হয়েছে')
      setIsModalOpen(false)
      setTableNumber('')
      fetchTables()
    } catch (err: any) {
      toast.error('টেবিল যোগ করতে সমস্যা: ' + err.message)
    }
  }

  async function updateTableStatus(id: string, status: RestaurantTable['status']) {
    try {
      await supabase.from('restaurant_tables').update({ status }).eq('id', id)
      setTables((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      toast.success('টেবিল স্ট্যাটাস আপডেট হয়েছে')
    } catch (err: any) {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ')
    }
  }

  async function handleDeleteTable(id: string) {
    if (!confirm('আপনি কি নিশ্চিত?')) return
    try {
      await supabase.from('restaurant_tables').delete().eq('id', id)
      toast.success('টেবিল মুছে ফেলা হয়েছে')
      fetchTables()
    } catch (err: any) {
      toast.error('মুছতে সমস্যা')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#CC0000]" />
            ডাইনিং টেবিল ম্যানেজমেন্ট
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            রেস্তোরাঁর টেবিল নম্বর, আসন সংখ্যা ও সিটের ফাঁকা/বসা অবস্থা পরিচালনা করুন
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          + নতুন টেবিল
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 p-8 text-center text-neutral-400">লোড হচ্ছে...</div>
        ) : tables.length === 0 ? (
          <div className="col-span-4 p-8 text-center text-neutral-400 bg-white rounded-xl border">
            বর্তমানে কোনো টেবিল নেই
          </div>
        ) : (
          tables.map((table) => {
            const isOccupied = table.status === 'occupied'
            return (
              <div
                key={table.id}
                className={`bg-white rounded-xl border-2 p-5 shadow-sm space-y-3 flex flex-col justify-between ${
                  isOccupied
                    ? 'border-amber-400 bg-amber-50/20'
                    : 'border-emerald-300 bg-emerald-50/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-neutral-900">
                      টেবিল #{table.table_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isOccupied
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {isOccupied ? 'বসা আছে' : 'ফাঁকা'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    সিট: {table.seats} জন • ফ্লোর: {table.floor}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => updateTableStatus(table.id, 'available')}
                      className={`py-1 text-[11px] font-bold rounded ${
                        table.status === 'available'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      ফাঁকা করুন
                    </button>
                    <button
                      onClick={() => updateTableStatus(table.id, 'occupied')}
                      className={`py-1 text-[11px] font-bold rounded ${
                        table.status === 'occupied'
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      বসা দেখান
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="text-neutral-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-3 text-xs">
            <h3 className="font-bold text-sm text-neutral-900">নতুন ডাইনিং টেবিল যোগ</h3>
            <div>
              <label className="font-semibold text-neutral-700">টেবিল নম্বর:</label>
              <input
                type="number"
                placeholder="যেমন: 7"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700">আসন সংখ্যা (Seats):</label>
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none"
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
                onClick={handleAddTable}
                className="flex-1 py-1.5 bg-[#CC0000] text-white font-bold rounded-lg shadow"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
