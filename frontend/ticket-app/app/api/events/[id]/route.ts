import {
  updateEventDetails,
  updateEventSchema,
  updatePaymentTokens,
  updateTicketTypes,
} from "@/lib/db/types";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const params = await context.params;
    const body = await request.json();
    let res;

    if (mode === "eventDetails") {
      const parsedData = updateEventDetails.parse(body);
      res = await prisma.event.update({
        where: { id: params.id },
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
          externalUrl: parsedData.externalUrl,
        },
      });
    } else if (mode === "ticketTypes") {
      const parsedData = updateTicketTypes.parse(body);

      res = await Promise.all(
        parsedData.ticketTypes.map((ticket) =>
          prisma.ticketType.update({
            where: { id: ticket.id },
            data: {
              price: ticket.price,
              totalSupply: ticket.totalSupply,
            },
          })
        )
      );
    } else if (mode === "paymentOptions") {
      const parsedData = updatePaymentTokens.parse(body);
      res = await prisma.event.update({
        where: { id: params.id },
        data: {
          paymentTokens: parsedData.paymentTokens,
        },
      });
    }
    return NextResponse.json({ res });
    // const parsedData = updateEventSchema.parse(body);

    // // Update the event
    // const event = await prisma.event.update({
    //   where: { id: params.id },
    //   data: {
    //     title: parsedData.title,
    //     symbol: parsedData.symbol,
    //     description: parsedData.description,
    //     imageUrl: parsedData.imageUrl,
    //     bannerUrl: parsedData.bannerUrl,
    //     category: parsedData.category,
    //     location: parsedData.location,
    //     startDate: new Date(parsedData.startDate),
    //     endDate: new Date(parsedData.endDate),
    //     paymentTokens: parsedData.paymentTokens,
    //     organizerAddress: parsedData.organizerAddress,
    //     ticketAddress: parsedData.ticketAddress,
    //     launchpadAddress: parsedData.launchpadAddress,
    //     marketAddress: parsedData.marketAddress,
    //     platformFeePercent: parsedData.platformFeePercent,
    //     royaltyFeePercent: parsedData.royaltyFeePercent,
    //     externalUrl: parsedData.externalUrl,
    //     // Handle ticket types
    //     ticketTypes: {
    //       deleteMany: {}, // Delete existing ticket types
    //       create: parsedData.ticketTypes
    //         ? parsedData.ticketTypes.map((ticketType) => ({
    //             name: ticketType.name,
    //             description: ticketType.description,
    //             price: ticketType.price,
    //             totalSupply: ticketType.totalSupply,
    //             typeValue: ticketType.typeValue,
    //           }))
    //         : [],
    //     },
    //   },
    //});
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete the event and associated ticket types
    await prisma.ticketType.deleteMany({ where: { eventId: params.id } });
    const event = await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Event deleted successfully", event });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        ticketTypes: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
