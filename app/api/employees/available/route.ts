import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const utilizationThreshold = parseInt(
      searchParams.get("utilizationThreshold") || "80",
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
              {
                startDate: { lte: new Date(endDate) },
                endDate: { gte: new Date(startDate) },
              },
              {
                startDate: { gte: new Date(startDate), lte: new Date(endDate) },
              },
              {
                endDate: { gte: new Date(startDate), lte: new Date(endDate) },
              },
            ],
          },
        },
      },
    });

    const availableEmployees = employees
      .map((employee) => {
        const totalUtilization = employee.assignments.reduce(
          (sum, assignment) => {
            const assignmentStart =
              new Date(assignment.startDate) < new Date(startDate)
                ? new Date(startDate)
                : new Date(assignment.startDate);
            const assignmentEnd =
              new Date(assignment.endDate) > new Date(endDate)
                ? new Date(endDate)
                : new Date(assignment.endDate);
            const assignmentDays =
              (assignmentEnd.getTime() - assignmentStart.getTime()) /
              (1000 * 3600 * 24);
            const totalDays =
              (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 3600 * 24);
            return sum + (assignment.utilisation * assignmentDays) / totalDays;
          },
          0
        );

        return {
          ...employee,
          currentUtilization: totalUtilization,
          availableUtilization: 100 - totalUtilization,
        };
      })
      .filter(
        (employee) =>
          employee.availableUtilization >= 100 - utilizationThreshold
      );

    return NextResponse.json(availableEmployees);
  } catch (error) {
    console.error("Failed to fetch available employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch available employees" },
      { status: 500 }
    );
  }
}
