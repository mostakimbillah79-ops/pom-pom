// PosBillingPage-এর মধ্যে এই helper-গুলো যোগ করুন।
// order-এর আসল shared serial backend-এ token_number নামে থাকলে সেটি দেখাবে;
// না থাকলে UUID-এর ছোট অংশ fallback হিসেবে দেখাবে।

type OrderWithToken = Order & {
  token_number?: number | string | null
  token_no?: number | string | null
  serial_number?: number | string | null
}

function getOrderToken(order: Order): string {
  const o = order as OrderWithToken
  const token = o.token_number ?? o.token_no ?? o.serial_number
  return token == null || token === ''
    ? order.id.slice(0, 8).toUpperCase()
    : String(token).padStart(3, '0')
}

function getOrderTypeLabel(order: Order): string {
  if (order.order_type === 'dine_in') {
    const tableNumber = order.table?.table_number
    return tableNumber ? `Dine In · টেবিল ${tableNumber}` : 'Dine In'
  }
  if (order.order_type === 'takeaway' || order.order_type === 'take_away') {
    return 'Take Away'
  }
  if (order.order_type === 'delivery') return 'Delivery'
  return 'অন্যান্য'
}

const statusLabels: Record<string, string> = {
  new: 'নতুন',
  preparing: 'রান্না হচ্ছে',
  ready: 'প্রস্তুত',
  served: 'পরিশোধিত / সার্ভড',
  cancelled: 'বাতিল',
}

// fetchOrders()-এ orders সেট করার আগে এই sort ব্যবহার করুন:
// setOrders((ordersRes.data ?? []).sort((a, b) =>
//   new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
// ))

// JSX-এ টোকেন সেলের বর্তমান অংশটি বদলান:
// <td className="p-3 font-mono font-black text-neutral-800">
//   #{getOrderToken(order)}
// </td>

// JSX-এ অর্ডারের ধরন দেখানোর বর্তমান ternary বদলান:
// <td className="p-3 font-semibold">{getOrderTypeLabel(order)}</td>

// স্ট্যাটাস span-এর ভেতরের {order.status} বদলে লিখুন:
// {statusLabels[order.status] ?? order.status}

// Customer Copy / Kitchen Copy বাটনের লেখা বদলান:
// কাস্টমার কপি
// কিচেন কপি (KOT)

// এই ফাইলের fetchOrders() থেকে setOrders অংশটি এভাবে বদলান:
// if (ordersRes.data) {
//   setOrders(
//     [...(ordersRes.data as Order[])]
//       .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
//   )
// }

// গুরুত্বপূর্ণ: এই পেজটি কেবল অর্ডার দেখায়, পেমেন্ট নেয় এবং প্রিন্ট করে।
// Counter থেকে নতুন Dine In / Take Away অর্ডার তৈরি করার ফর্ম এখানে নেই।
// Website ও Counter মিলিয়ে একই ধারাবাহিক serial নিশ্চিত করতে শুধু UI-তে সংখ্যা
// বানানো যাবে না—orders টেবিলে shared token_number এবং database-side atomic
// sequence/function দরকার। এতে একই সময়ে দুই উৎস থেকে অর্ডার এলেও serial
// duplicate হবে না।
