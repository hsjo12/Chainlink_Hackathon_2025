import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { CreateTicketValidationSchema } from "@/lib/db/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = CreateTicketValidationSchema.parse(body);

    // Create the ticket validation
    const ticketValidation = await prisma.ticketValidation.create({
      data: {
        contractAddress: parsedData.contractAddress,
        tokenId: parsedData.tokenId,
        eventId: parsedData.eventId,
        ticketTypeId: parsedData.ticketTypeId,
      },
    });

    return NextResponse.json({ ticketValidation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating ticket validation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get("contractAddress");
    const tokenId = searchParams.get("tokenId");

    if (!contractAddress || !tokenId) {
      return NextResponse.json(
        { error: "Contract address and token ID are required" },
        { status: 400 }
      );
    }

    const ticketValidation = await prisma.ticketValidation.findFirst({
      where: {
        contractAddress,
        tokenId,
      },
    });

    if (!ticketValidation) {
      return NextResponse.json(
        { error: "Ticket validation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticketValidation });
  } catch (error) {
    console.error("Error fetching ticket validation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
