import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const availabilityThreshold = parseInt(
      searchParams.get("availabilityThreshold") || "80",
      10
    );

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const employees = await prisma.employee.findMany({
      include: {
        assignments: {
          where: {
            OR: [
              // Assignments that overlap with the requested period
              {
                AND: [
                  { startDate: { lte: new Date(endDate) } },
                  { endDate: { gte: new Date(startDate) } },
                ],
              },
            ],
          },
        },
      },
    });

    const availableEmployees = employees
      .map((employee) => {
        // Sum up all utilizations from overlapping assignments
        const currentUtilization = employee.assignments.reduce(
          (sum, assignment) => {
            return sum + assignment.utilisation;
          },
          0
        );

        // Calculate available utilization (can be negative if over-utilized)
        const availableUtilization = 100 - currentUtilization;

        return {
          id: employee.id,
          name: employee.name,
          seniority: employee.seniority,
          skills: employee.skills,
          currentUtilization: parseFloat(currentUtilization.toFixed(1)),
          availableUtilization: parseFloat(availableUtilization.toFixed(1)),
        };
      })
      .filter(
        (employee) => employee.availableUtilization >= availabilityThreshold
      )
      .sort((a, b) => b.availableUtilization - a.availableUtilization);

    return NextResponse.json(availableEmployees);
  } catch (error) {
    console.error(
      "Failed to fetch employees with minimum availability:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch employees with minimum availability" },
      { status: 500 }
    );
  }
}
