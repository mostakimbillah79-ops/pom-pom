"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: POM POM Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="POM POM Logo"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <span className="font-extrabold text-xl text-red-600 tracking-wider">POM POM</span>
        </Link>

        {/* Right: Only Sign In Button */}
        <div className="flex items-center gap-3">
          <Link href="/signin">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-full shadow-md text-sm min-h-[40px]">
              SIGN IN
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
