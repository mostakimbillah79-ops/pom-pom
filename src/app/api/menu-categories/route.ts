import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/auth'

const prisma = new PrismaClient()

async function checkAdminAccess(req: NextRequest) {
  const session = await auth(req)

  if (!session?.user) {
    return NextResponse.json(
      { error: 'অননুমোদিত অ্যাক্সেস' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'প্রশাসক অধিকার প্রয়োজন' },
      { status: 403 }
    )
  }

  return null
}

export async function GET() {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: 'ক্যাটেগরি লোড ব্যর্থ' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const authError = await checkAdminAccess(req)
  if (authError) return authError

  try {
    const { name_bn, name_en } = await req.json()

    if (!name_bn || !name_en) {
      return NextResponse.json(
        { error: 'উভয় নাম প্রয়োজন' },
        { status: 400 }
      )
    }

    const lastCategory = await prisma.menuCategory.findFirst({
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastCategory?.order || 0) + 1

    const category = await prisma.menuCategory.create({
      data: {
        name_bn,
        name_en,
        order: nextOrder
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'ক্যাটেগরি তৈরি ব্যর্থ' },
      { status: 500 }
    )
  }
}
