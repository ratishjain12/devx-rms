import prisma from "@/db/db.config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: { employee: true },
    });

    const employeeUtilization: Record<
      number,
      { employee: { id: number; name: string }; utilization: number }
    > = {};

    // Calculate total utilization per employee
    assignments.forEach((assignment) => {
      if (!employeeUtilization[assignment.employeeId]) {
        employeeUtilization[assignment.employeeId] = {
          employee: assignment.employee,
          utilization: 0,
        };
      }
      employeeUtilization[assignment.employeeId].utilization +=
        assignment.utilisation || 0;
    });

    // Filter employees with utilization > 100%
    const overworkedEmployees = Object.values(employeeUtilization).filter(
      (data) => data.utilization > 100
    );
    console.log(overworkedEmployees);

    return NextResponse.json({ overworkedEmployees });
  } catch (error) {
    console.error("Error fetching overworked employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch overworked employees" },
      { status: 500 }
    );
  }
}
