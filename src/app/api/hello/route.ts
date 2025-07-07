// src/app/api/hello/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const wp = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}`)
  const data = await wp.json()

  return NextResponse.json(data)
}
