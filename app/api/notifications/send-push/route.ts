import { NextRequest, NextResponse } from 'next/server'
import { POST as pushPostHandler, GET as pushGetHandler } from '../push/route'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return pushGetHandler()
}

export async function POST(req: NextRequest) {
  return pushPostHandler(req)
}
