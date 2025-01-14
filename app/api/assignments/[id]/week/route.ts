import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { endOfWeek, isWithinInterval } from "date-fns";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await params;
    const assignmentId = parseInt(data.id);

    let requestBody: { weekStart: string };
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { weekStart } = requestBody;
    if (!weekStart) {
      return NextResponse.json(
        { error: "Week start date is required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        employee: true,
        project: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const weekStartDate = new Date(weekStart);
    const weekEndDate = endOfWeek(weekStartDate);
    const assignmentStartDate = new Date(assignment.startDate);
    const assignmentEndDate = new Date(assignment.endDate);

    // If assignment only spans this week, delete it
    if (
      isWithinInterval(assignmentStartDate, {
        start: weekStartDate,
        end: weekEndDate,
      }) &&
      isWithinInterval(assignmentEndDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      const deletedAssignment = await prisma.assignment.delete({
        where: { id: assignmentId },
      });
      return NextResponse.json({
        message: "Assignment deleted successfully",
        deletedAssignment,
      });
    }
    // If the week is at the start of the assignment
    else if (
      isWithinInterval(assignmentStartDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          startDate: new Date(
            weekEndDate.getTime() + 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json({ updatedAssignment });
    }
    // If the week is at the end of the assignment
    else if (
      isWithinInterval(assignmentEndDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          endDate: new Date(
            weekStartDate.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json({ updatedAssignment });
    }
    // If the week is in the middle of the assignment
    else {
      const [firstPart, secondPart] = await prisma.$transaction([
        prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            endDate: new Date(
              weekStartDate.getTime() - 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          include: {
            employee: true,
            project: true,
          },
        }),
        prisma.assignment.create({
          data: {
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            startDate: new Date(
              weekEndDate.getTime() + 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: assignment.endDate,
            utilisation: assignment.utilisation,
          },
          include: {
            employee: true,
            project: true,
          },
        }),
      ]);

      return NextResponse.json({
        message: "Week deleted and assignment split",
        firstPart,
        secondPart,
      });
    }
  } catch (error) {
    console.error("Error deleting assignment week:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Failed to delete assignment week",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
