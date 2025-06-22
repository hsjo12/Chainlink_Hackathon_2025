import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { z } from 'zod'
import { CreateEventSchema, CryptoCurrencyEnum } from '@/lib/types'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = CreateEventSchema.parse(body)

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: parsedData.title,
        description: parsedData.description,
        imageUrl: parsedData.imageUrl,
        bannerUrl: parsedData.bannerUrl,
        category: parsedData.category,
        location: parsedData.location,
        startDate: new Date(parsedData.startDate),
        endDate: new Date(parsedData.endDate),
        timezone: parsedData.timezone,
        organizerAddress: parsedData.organizerAddress,
        ticketAddress: parsedData.ticketAddress,
        launchpadAddress: parsedData.launchpadAddress,
        marketAddress: parsedData.marketAddress,
        platformFeePercent: parsedData.platformFeePercent,
        royaltyFeePercent: parsedData.royaltyFeePercent,
      },
    })

    // Create ticket types
    const ticketTypes = await prisma.ticketType.createMany({
      data: parsedData.ticketTypes.map((ticketType) => ({
        eventId: event.id,
        name: ticketType.name,
        description: ticketType.description,
        price: ticketType.price,
        currency: ticketType.currency || CryptoCurrencyEnum.USDC,
        totalSupply: ticketType.totalSupply,
      })),
    })

    return NextResponse.json({ event, ticketTypes })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      include: {
        ticketTypes: true,
      },
    })
    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events found' }, { status: 404 })
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
