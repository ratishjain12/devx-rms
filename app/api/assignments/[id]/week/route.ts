import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { startOfWeek, endOfWeek, addDays, subDays } from "date-fns";

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

    // Handle dates consistently by keeping them as ISO strings
    const weekStartDate = startOfWeek(new Date(weekStart));
    const weekEndDate = endOfWeek(weekStartDate);
    const assignmentStartDate = new Date(assignment.startDate);
    const assignmentEndDate = new Date(assignment.endDate);

    // If assignment only spans this week, delete it
    if (
      assignmentStartDate >= weekStartDate &&
      assignmentEndDate <= weekEndDate
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
      assignmentStartDate >= weekStartDate &&
      assignmentStartDate <= weekEndDate
    ) {
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          startDate: addDays(weekEndDate, 1).toISOString(),
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
      assignmentEndDate >= weekStartDate &&
      assignmentEndDate <= weekEndDate
    ) {
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          endDate: subDays(weekStartDate, 1).toISOString(),
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
            endDate: subDays(weekStartDate, 1).toISOString(),
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
            startDate: addDays(weekEndDate, 1).toISOString(),
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
    console.error("Error deleting assignment week:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment week" },
      { status: 500 }
    );
  }
}
