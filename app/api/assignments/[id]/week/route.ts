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

    // Debug logging
    console.log("Received params:", { data, assignmentId });

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

    // Get the current assignment
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

    const weekStartDate = new Date(weekStart);
    const weekEndDate = endOfWeek(weekStartDate);
    const assignmentStartDate = new Date(assignment.startDate);
    const assignmentEndDate = new Date(assignment.endDate);

    console.log("Date calculations:", {
      weekStartDate,
      weekEndDate,
      assignmentStartDate,
      assignmentEndDate,
    });

    // If the week is at the start of the assignment
    if (
      isWithinInterval(assignmentStartDate, {
        start: weekStartDate,
        end: weekEndDate,
      })
    ) {
      console.log("Updating start date of assignment");
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          startDate: new Date(weekEndDate.getTime() + 86400000).toISOString(), // Start after the week ends
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
      console.log("Updating end date of assignment");
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          endDate: new Date(weekStartDate.getTime() - 86400000).toISOString(), // End before the week starts
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
      console.log("Splitting assignment into two parts");

      // Calculate the new start date for the second part of the assignment
      const newStartDate = new Date(weekEndDate.getTime() + 86400000); // Start after the week ends

      // Check for conflicts in a single query
      const conflictingAssignment = await prisma.assignment.findFirst({
        where: {
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          startDate: newStartDate.toISOString(),
        },
      });

      if (conflictingAssignment) {
        console.error(
          "Conflict detected with assignment:",
          conflictingAssignment
        );
        return NextResponse.json(
          { error: "Conflict detected with existing assignment" },
          { status: 400 }
        );
      }

      // Proceed with creating the new assignments
      const [updatedAssignment, newAssignment] = await prisma.$transaction([
        prisma.assignment.update({
          where: { id: assignmentId },
          data: {
            endDate: new Date(weekStartDate.getTime() - 86400000).toISOString(), // End before the week starts
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
            startDate: newStartDate.toISOString(), // Start after the week ends
            endDate: assignment.endDate,
            utilisation: assignment.utilisation, // Keep the same utilisation
          },
          include: {
            employee: true,
            project: true,
          },
        }),
      ]);

      // Debug logs
      console.log("Updated Assignment:", {
        id: updatedAssignment.id,
        startDate: updatedAssignment.startDate,
        endDate: updatedAssignment.endDate,
        utilisation: updatedAssignment.utilisation,
      });

      console.log("New Assignment:", {
        id: newAssignment.id,
        startDate: newAssignment.startDate,
        endDate: newAssignment.endDate,
        utilisation: newAssignment.utilisation,
      });

      return NextResponse.json({ updatedAssignment, newAssignment });
    }
  } catch (error) {
    // Enhanced error logging
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
