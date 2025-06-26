import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { z } from 'zod'
import { UpdateTicketValidationSchema } from '@/lib/types'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsedData = UpdateTicketValidationSchema.parse(body)

    // Update the ticket validation
    const ticketValidation = await prisma.ticketValidation.update({
      where: { id: params?.id },
      data: {
        ...parsedData,
        usedAt: parsedData.usedAt ? new Date(parsedData.usedAt) : undefined,
        validatedBy: parsedData.validatedBy || undefined,
      },
    })

    return NextResponse.json({ ticketValidation })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating ticket validation:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
