import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const filename = (await params).slug
  const filePath = path.join(process.cwd(), 'public/images', filename)

  try {
    const imageBuffer = fs.readFileSync(filePath)
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    console.error(e)
    return new NextResponse('Image not found', { status: 404 })
  }
}