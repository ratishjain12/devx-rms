import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

// Helper functions for date handling with explicit UTC conversion

// const getEndOfWeek = (date: Date): Date => {
//   const d = new Date(date);
//   const daysToAdd = 6; // Add 6 days to get the end of the week
//   d.setUTCDate(d.getUTCDate() + daysToAdd); // Add days to reach the end of the week
//   return setEndOfDay(d); // Set to the end of the day (23:59:59.999)
// };

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await params;
    const id = parseInt(data.id);

    // Find the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: id },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Delete the specific week's assignment
    await prisma.assignment.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: "Week deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete week: ${error}` },
      { status: 500 }
    );
  }
}
