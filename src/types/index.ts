export type UserRole = 'admin' | 'kitchen' | 'customer'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  name_bn: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Ingredient {
  id: string
  name: string
  name_bn: string | null
  unit: string // 'gm', 'ml', 'pcs', 'kg'
  current_stock: number
  total_purchased: number
  cost_per_unit: number
  is_active: boolean
  created_at: string
}

export interface RecipeItem {
  id: string
  menu_item_id: string
  ingredient_id: string
  quantity_gm: number
  unit: string
  ingredient?: Ingredient
}

export interface MenuItem {
  id: string
  category_id: string | null
  name: string
  name_bn: string | null
  description: string | null
  price: number
  cost_price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  category?: Category
  recipes?: RecipeItem[]
}

export interface RestaurantTable {
  id: string
  table_number: number
  seats: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  floor: string
  created_at: string
}

export interface OrderItem {
  id?: string
  order_id?: string
  menu_item_id: string | null
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: string
  table_id: string | null
  customer_name: string | null
  customer_phone: string | null
  order_type: 'dine_in' | 'takeaway' | 'delivery' | 'whatsapp'
  status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled'
  notes: string | null
  discount: number
  subtotal: number
  total: number
  created_at: string
  updated_at: string
  table?: RestaurantTable
  order_items?: OrderItem[]
}

export interface Bill {
  id: string
  order_id: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_method: 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket'
  paid_at: string
  order?: Order
}

export interface Employee {
  id: string
  name: string
  phone: string | null
  role: string | null
  salary: number
  join_date: string | null
  is_active: boolean
  created_at: string
}

export interface Expense {
  id: string
  type: 'salary' | 'electricity' | 'rent' | 'delivery' | 'ingredient' | 'maintenance' | 'marketing' | 'other'
  description: string | null
  amount: number
  expense_date: string
  month: number | null
  year: number | null
  employee_id: string | null
  employee?: Employee
  created_at: string
}

export interface RestaurantSettings {
  restaurant_name: string
  address: string
  phone: string
  whatsapp: string
  tax_rate: string
  currency_symbol: string
  admin_pin?: string
  kitchen_pin?: string
  recovery_email?: string
}
