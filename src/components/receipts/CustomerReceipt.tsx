'use client'

import React from 'react'
import { Order, RestaurantSettings } from '@/types'

interface CustomerReceiptProps {
  order: Order
  settings: RestaurantSettings
}

export const CustomerReceipt = React.forwardRef<HTMLDivElement, CustomerReceiptProps>(
  ({ order, settings }, ref) => {
    const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    return (
      <div
        ref={ref}
        className="w-[80mm] max-w-[80mm] p-4 bg-white text-black font-mono text-xs leading-tight mx-auto select-none print:m-0 print:p-2"
        style={{ fontFamily: 'Courier New, Courier, monospace' }}
      >
        {/* Header */}
        <div className="text-center pb-2 border-b border-dashed border-gray-400">
          <div className="w-24 h-12 mx-auto mb-1 relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Pom Pom" className="max-h-12 object-contain" />
          </div>
          <h1 className="text-base font-bold uppercase tracking-wider">{settings.restaurant_name || 'Pom Pom'}</h1>
          <p className="text-[10px] text-gray-700 italic">Passion of Making • Promise of More</p>
          <p className="text-[10px] mt-0.5">{settings.address || 'Jhenaidah'}</p>
          {settings.phone && <p className="text-[10px]">Tel: {settings.phone}</p>}
          {settings.whatsapp && <p className="text-[10px]">WhatsApp: {settings.whatsapp}</p>}
        </div>

        {/* Order Meta */}
        <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
          <div className="flex justify-between">
            <span className="font-semibold">Invoice:</span>
            <span>#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-bold uppercase bg-gray-100 px-1 rounded">
              {order.order_type === 'dine_in'
                ? `Table #${order.table?.table_number || 'N/A'}`
                : order.order_type.toUpperCase()}
            </span>
          </div>
          {order.customer_name && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customer_name}</span>
            </div>
          )}
        </div>

        {/* Item Table */}
        <div className="py-2 border-b border-dashed border-gray-400">
          <div className="grid grid-cols-12 font-bold pb-1 text-[11px] border-b border-gray-300">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Rate</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          <div className="pt-1 space-y-1">
            {order.order_items?.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-[11px]">
                <span className="col-span-6 truncate font-medium">{item.item_name}</span>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-2 text-right">{item.unit_price}</span>
                <span className="col-span-2 text-right font-bold">{item.subtotal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation */}
        <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{settings.currency_symbol || '৳'} {order.subtotal}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>-{settings.currency_symbol || '৳'} {order.discount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
            <span>NET TOTAL:</span>
            <span>{settings.currency_symbol || '৳'} {order.total}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 space-y-1">
          <p className="font-bold text-[11px] italic">Thank You for Choosing pompom</p>
          <p className="text-[9px] text-gray-500">Please visit again! Have a great day.</p>
          <p className="text-[8px] text-gray-400 pt-1">Powered by Pom Pom POS</p>
        </div>
      </div>
    )
  }
)

CustomerReceipt.displayName = 'CustomerReceipt'
