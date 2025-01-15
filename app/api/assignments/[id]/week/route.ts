import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { endOfWeek, isWithinInterval } from "date-fns";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = parseInt(params.id);
    const requestBody = await request.json();
    const { weekStart } = requestBody;

    if (!weekStart) {
      return NextResponse.json(
        { error: "Week start date is required" },
        { status: 400 }
      );
    }

    // Get the current assignment
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

    // If the week is in the middle of the assignment
    if (
      assignmentStartDate < weekStartDate &&
      assignmentEndDate > weekEndDate
    ) {
      // Create two new assignments
      const [firstPart, secondPart] = await prisma.$transaction([
        prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            endDate: new Date(weekStartDate.getTime() - 86400000),
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
            startDate: new Date(weekEndDate.getTime() + 86400000),
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
        updatedAssignment: firstPart,
        newAssignment: secondPart,
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
          startDate: new Date(weekEndDate.getTime() + 86400000),
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
          endDate: new Date(weekStartDate.getTime() - 86400000),
        },
        include: {
          employee: true,
          project: true,
        },
      });
      return NextResponse.json({ updatedAssignment });
    }

    return NextResponse.json({ error: "Invalid week range" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting assignment week:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment week" },
      { status: 500 }
    );
  }
}
