import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, projectId, startDate, endDate, utilisation } = body;

    // Validate the input
    if (!employeeId || !projectId || !startDate || !endDate || !utilisation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a single assignment
    const assignment = await prisma.assignment.create({
      data: {
        employeeId,
        projectId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        utilisation,
      },
      include: {
        employee: true,
        project: true,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "Employee is already assigned to this project for the given date range",
        },
        { status: 409 }
      );
    }

    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

export async function GET() {
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
