import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { UpdateTicketValidationSchema } from "@/lib/db/types";

export async function PUT(request: NextRequest, context: any) {
  try {
    const body = await request.json();
    const parsedData = UpdateTicketValidationSchema.parse(body);
    const { id } = context.params;
    // Update the ticket validation
    const ticketValidation = await prisma.ticketValidation.update({
      where: { id },
      data: {
        ...parsedData,
        usedAt: parsedData.usedAt ? new Date(parsedData.usedAt) : undefined,
        validatedBy: parsedData.validatedBy || undefined,
      },
    });

    return NextResponse.json({ ticketValidation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating ticket validation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
