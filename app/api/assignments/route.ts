import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, projectId, startDate, endDate, utilisation } = body;

    // Create single week assignment
    const assignment = await prisma.assignment.create({
      data: {
        employeeId,
        projectId,
        startDate,
        endDate,
        utilisation,
      },
      include: {
        employee: true,
        project: true,
      },
    });

    console.log("Created assignment:", assignment);
    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      {
        error: "Failed to create assignment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
export async function GET(): Promise<NextResponse> {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        employee: true,
        project: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
