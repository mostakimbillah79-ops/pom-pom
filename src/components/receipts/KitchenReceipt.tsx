'use client'

import React from 'react'
import { Order } from '@/types'

interface KitchenReceiptProps {
  order: Order
}

export const KitchenReceipt = React.forwardRef<HTMLDivElement, KitchenReceiptProps>(
  ({ order }, ref) => {
    const formattedTime = new Date(order.created_at || Date.now()).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <div
        ref={ref}
        className="w-[80mm] max-w-[80mm] p-4 bg-white text-black font-mono text-xs leading-tight mx-auto select-none print:m-0 print:p-2"
        style={{ fontFamily: 'Courier New, Courier, monospace' }}
      >
        {/* KOT Header */}
        <div className="text-center pb-2 border-b-2 border-black">
          <h1 className="text-xl font-black uppercase tracking-wider">*** KITCHEN ORDER (KOT) ***</h1>
          <p className="text-sm font-bold mt-1">
            {order.order_type === 'dine_in'
              ? `TABLE #${order.table?.table_number || 'N/A'}`
              : `TYPE: ${order.order_type.toUpperCase()}`}
          </p>
          <div className="flex justify-between text-xs mt-1 px-1">
            <span>Token: #{order.id.slice(0, 6).toUpperCase()}</span>
            <span>Time: {formattedTime}</span>
          </div>
        </div>

        {/* Items List - Bold & High Contrast for Chefs */}
        <div className="py-3 border-b-2 border-black">
          <div className="grid grid-cols-12 font-black text-sm pb-1 border-b border-black">
            <span className="col-span-3 text-center">QTY</span>
            <span className="col-span-9">ITEM DESCRIPTION</span>
          </div>
          <div className="pt-2 space-y-2">
            {order.order_items?.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-sm items-center">
                <span className="col-span-3 text-center font-black text-base bg-black text-white rounded py-0.5">
                  {item.quantity}x
                </span>
                <span className="col-span-9 pl-2 font-bold uppercase text-sm">
                  {item.item_name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions / Notes */}
        {order.notes && (
          <div className="py-2 border-b border-dashed border-black">
            <span className="font-bold block text-xs underline">SPECIAL NOTES:</span>
            <p className="text-sm font-semibold uppercase bg-gray-100 p-1 mt-0.5 rounded">
              {order.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 text-[10px]">
          <p className="font-bold">Please expedite freshly cooked order!</p>
          <p className="text-gray-500">Pom Pom Kitchen System</p>
        </div>
      </div>
    )
  }
)

KitchenReceipt.displayName = 'KitchenReceipt'
