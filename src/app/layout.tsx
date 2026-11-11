import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "Pom Pom - Fast Food & Restaurant | Passion of Making. Promise of More",
  description: "Pom Pom Fast Food, Jhenaidah. We provide delicious fast food - Crispy Chicken Fry, Mini Burger, French Fries & More. Order now for hot & fresh taste!",
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          {children}
        </main>
        <footer className="border-t border-neutral-200 bg-white py-4 text-center text-xs text-neutral-500">
          <p className="font-semibold text-neutral-700">Pom Pom • Jhenaidah</p>
          <p className="italic text-[11px] text-red-600 font-medium">Thank You for Choosing pompom</p>
          <p className="text-[10px] text-neutral-400 mt-1">© {new Date().getFullYear()} Pom Pom Fast Food POS System</p>
        </footer>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
