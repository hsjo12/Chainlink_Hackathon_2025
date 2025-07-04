import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { CreateEventSchema } from "@/lib/db/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = CreateEventSchema.parse(body);

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: parsedData.title,
        symbol: parsedData.symbol,
        description: parsedData.description,
        imageUrl: parsedData.imageUrl,
        bannerUrl: parsedData.bannerUrl,
        category: parsedData.category,
        location: parsedData.location,
        startDate: new Date(parsedData.startDate),
        endDate: new Date(parsedData.endDate),
        paymentTokens: parsedData.paymentTokens,
        organizerAddress: parsedData.organizerAddress,
        ticketAddress: parsedData.ticketAddress,
        launchpadAddress: parsedData.launchpadAddress,
        marketAddress: parsedData.marketAddress,
        platformFeePercent: parsedData.platformFeePercent,
        royaltyFeePercent: parsedData.royaltyFeePercent,
        externalUrl: parsedData.externalUrl,
      },
    });

    // Create ticket types
    const ticketTypes = await prisma.ticketType.createMany({
      data: parsedData.ticketTypes.map((ticketType) => ({
        eventId: event.id,
        name: ticketType.name,
        description: ticketType.description,
        price: ticketType.price,
        totalSupply: ticketType.totalSupply,
        typeValue: ticketType.typeValue,
      })),
    });

    return NextResponse.json({ event, ticketTypes });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizerAddress = searchParams.get("address");

  try {
    if (organizerAddress) {
      const events = await prisma.event.findMany({
        where: { organizerAddress },
        include: { ticketTypes: true },
      });

      const addressesResult = await prisma.event.findMany({
        where: { organizerAddress },
        select: { ticketAddress: true },
      });

      const ticketAddresses = addressesResult.map(
        (item: any) => item.ticketAddress
      );

      return NextResponse.json({
        events,
        ticketAddresses,
      });
    } else {
      const events = await prisma.event.findMany({
        include: { ticketTypes: true },
      });

      return NextResponse.json(events);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
