import { updateEventSchema } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { z } from 'zod'
const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsedData = updateEventSchema.parse(body)

    // Update the event
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title: parsedData.title,
        description: parsedData.description,
        imageUrl: parsedData.imageUrl,
        bannerUrl: parsedData.bannerUrl,
        category: parsedData.category,
        location: parsedData.location,
        startDate: parsedData.startDate
          ? new Date(parsedData.startDate)
          : undefined,
        endDate: parsedData.endDate ? new Date(parsedData.endDate) : undefined,
        timezone: parsedData.timezone,
        organizerAddress: parsedData.organizerAddress,
        ticketAddress: parsedData.ticketAddress,
        launchpadAddress: parsedData.launchpadAddress,
        marketAddress: parsedData.marketAddress,
        platformFeePercent: parsedData.platformFeePercent,
        royaltyFeePercent: parsedData.royaltyFeePercent,
        maxPerWallet: parsedData.maxPerWallet,
        // Handle ticket types
        ticketTypes: {
          deleteMany: {}, // Delete existing ticket types
          create: parsedData.ticketTypes
            ? parsedData.ticketTypes.map((ticketType) => ({
                name: ticketType.name,
                description: ticketType.description,
                price: ticketType.price,
                currency: ticketType.currency,
                totalSupply: ticketType.totalSupply,
              }))
            : [],
        },
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete the event and associated ticket types
    await prisma.ticketType.deleteMany({ where: { eventId: params.id } })
    const event = await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Event deleted successfully', event })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        ticketTypes: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
