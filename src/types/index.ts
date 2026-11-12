export interface MenuCategory {
  id: string
  name_bn: string
  name_en: string
  order: number
  createdAt: string
}

export interface MenuItem {
  id: string
  name_bn: string
  name_en: string
  price: number
  description?: string
  categoryId: string
}

export interface RawMaterial {
  id: string
  name_bn: string
  name_en: string
  unit_bn: string
  unit_en: string
  totalPurchased: number
  currentStock: number
  unitPrice: number
  percentageUsed?: number
  percentageRemaining?: number
  isLowStock?: boolean
  createdAt: string
  lastUpdated: string
}
