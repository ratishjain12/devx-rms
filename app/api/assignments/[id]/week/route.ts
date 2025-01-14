import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { endOfWeek, isWithinInterval, startOfDay, endOfDay } from "date-fns";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await params;
    const assignmentId = parseInt(data.id);

    let requestBody;
    try {
      requestBody = await request.json();
      console.log("Request body:", requestBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { weekStart } = requestBody;

    if (!weekStart) {
      console.error("Missing weekStart in request body");
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
      console.error("Assignment not found:", assignmentId);
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const weekStartDate = startOfDay(new Date(weekStart));
    const weekEndDate = endOfDay(endOfWeek(weekStartDate));
    const assignmentStartDate = startOfDay(new Date(assignment.startDate));
    const assignmentEndDate = startOfDay(new Date(assignment.endDate));

    // If assignment only spans this week, delete it entirely
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
      // Delete the entire assignment
      await prisma.assignment.delete({
        where: { id: assignmentId },
      });
      return NextResponse.json({ message: "Assignment deleted successfully" });
    }
    // If the week is at the start of the assignment
    else if (
      isWithinInterval(assignmentStartDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      const newStartDate = new Date(weekEndDate);
      newStartDate.setDate(weekEndDate.getDate() + 1);

      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          startDate: startOfDay(newStartDate).toISOString(),
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
      const newEndDate = new Date(weekStartDate);
      newEndDate.setDate(weekStartDate.getDate() - 1);

      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          endDate: endOfDay(newEndDate).toISOString(),
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
      const splitEndDate = new Date(weekStartDate);
      splitEndDate.setDate(weekStartDate.getDate() - 1);

      const splitStartDate = new Date(weekEndDate);
      splitStartDate.setDate(weekEndDate.getDate() + 1);

      const [firstPart, secondPart] = await prisma.$transaction([
        // Update the first part
        prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            endDate: endOfDay(splitEndDate).toISOString(),
          },
          include: {
            employee: true,
            project: true,
          },
        }),
        // Create the second part
        prisma.assignment.create({
          data: {
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            startDate: startOfDay(splitStartDate).toISOString(),
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
