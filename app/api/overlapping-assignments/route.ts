import prisma from "@/db/db.config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Step 1: Fetch all assignments with employee details
    const assignments = await prisma.assignment.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: "asc" }, // Helps optimize overlap checks
    });

    if (!assignments.length) {
      return NextResponse.json({ totalCount: 0, topOverlappingEmployees: [] });
    }

    // Step 2: Check overlaps with optimized logic
    const overlapMap: Map<
      number,
      { employee: { id: number; name: string }; overlapCount: number }
    > = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeAssignmentsMap: Record<number, any[]> = {};

    for (const assignment of assignments) {
      const { employeeId } = assignment;
      if (!employeeAssignmentsMap[employeeId]) {
        employeeAssignmentsMap[employeeId] = [];
      }
      employeeAssignmentsMap[employeeId].push(assignment);
    }

    for (const [employeeId, empAssignments] of Object.entries(
      employeeAssignmentsMap
    )) {
      empAssignments.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      let overlapCount = 0;
      for (let i = 0; i < empAssignments.length - 1; i++) {
        const current = empAssignments[i];
        const next = empAssignments[i + 1];

        if (new Date(current.endDate) >= new Date(next.startDate)) {
          overlapCount += 1;
        }
      }

      if (overlapCount > 0) {
        const employee = empAssignments[0].employee;
        overlapMap.set(parseInt(employeeId), { employee, overlapCount });
      }
    }

    // Step 3: Sort overlaps and get the top 5 employees
    const overlappingEmployees = Array.from(overlapMap.values()).sort(
      (a, b) => b.overlapCount - a.overlapCount
    );

    const topOverlappingEmployees = overlappingEmployees.slice(0, 5);

    return NextResponse.json({
      totalCount: overlappingEmployees.length,
      topOverlappingEmployees,
    });
  } catch (error) {
    console.error("Failed to fetch overlapping assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch overlapping assignments" },
      { status: 500 }
    );
  }
}
