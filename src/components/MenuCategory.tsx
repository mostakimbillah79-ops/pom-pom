'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import type { MenuCategory } from '@/types'

export default function MenuCategoryManager() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name_bn: '', name_en: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/menu-categories')
      if (!res.ok) throw new Error('ক্যাটেগরি লোড ব্যর্থ')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      toast({ title: 'ত্রুটি', description: 'ক্যাটেগরি লোড করতে ব্যর্থ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (category?: MenuCategory) => {
    if (category) {
      setEditingId(category.id)
      setFormData({ name_bn: category.name_bn, name_en: category.name_en })
    } else {
      setEditingId(null)
      setFormData({ name_bn: '', name_en: '' })
    }
    setOpenDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name_bn.trim() || !formData.name_en.trim()) {
      toast({ title: 'ত্রুটি', description: 'উভয় নাম পূরণ করুন', variant: 'destructive' })
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/menu-categories/${editingId}` : '/api/menu-categories'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('সংরক্ষণ ব্যর্থ')

      toast({ title: 'সফল', description: editingId ? 'ক্যাটেগরি আপডেট হয়েছে' : 'ক্যাটেগরি যোগ হয়েছে' })
      setOpenDialog(false)
      fetchCategories()
    } catch (error) {
      toast({ title: 'ত্রুটি', description: 'সংরক্ষণে ব্যর্থ', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/menu-categories/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('মুছতে ব্যর্থ')

      toast({ title: 'সফল', description: 'ক্যাটেগরি মুছে দেওয়া হয়েছে' })
      setDeleteId(null)
      fetchCategories()
    } catch (error) {
      toast({ title: 'ত্রুটি', description: 'মুছতে ব্যর্থ', variant: 'destructive' })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>মেনু ক্যাটেগরি পরিচালনা</CardTitle>
          <Button onClick={() => handleOpen()} className="gap-2">
            <Plus className="w-4 h-4" />
            নতুন ক্যাটেগরি
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">লোড হচ্ছে...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">কোন ক্যাটেগরি নেই</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>বাংলা নাম</TableHead>
                  <TableHead>English Name</TableHead>
                  <TableHead className="w-24">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name_bn}</TableCell>
                    <TableCell>{category.name_en}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpen(category)}
                        className="gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        সম্পাদন
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(category.id)}
                        className="gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        মুছুন
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'ক্যাটেগরি সম্পাদন করুন' : 'নতুন ক্যাটেগরি যোগ করুন'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">বাংলা নাম</label>
              <Input
                value={formData.name_bn}
                onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                placeholder="যেমন: মেনু, পানীয়, মুরগি"
              />
            </div>
            <div>
              <label className="text-sm font-medium">English Name</label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="e.g. Menu, Drinks, Chicken"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              বাতিল
            </Button>
            <Button onClick={handleSave}>
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>নিশ্চিত করুন</AlertDialogTitle>
          <AlertDialogDescription>
            এই ক্যাটেগরি মুছে দেওয়া হবে। এটি পূর্বাবস করা যাবে না।
          </AlertDialogDescription>
          <AlertDialogCancel>বাতিল</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600">
            মুছুন
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
