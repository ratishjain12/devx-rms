// app/api/assignments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeIds, projectId, startDate, endDate, utilisation } = body;

    // Validate the input
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: "employeeIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Create assignments for all employees in a transaction
    const assignments = await prisma.$transaction(async (tx) => {
      const assignmentPromises = employeeIds.map((employeeId) =>
        tx.assignment.create({
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
        })
      );

      return Promise.all(assignmentPromises);
    });

    return NextResponse.json(assignments, { status: 201 });
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "One or more employees are already assigned to this project for the given date range",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create assignments" },
      { status: 500 }
    );
  }
}
