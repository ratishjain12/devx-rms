import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        assignments: {
          include: {
            project: true,
          },
        },
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Failed to fetch employees with assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees with assignments" },
      { status: 500 }
    );
  }
}
