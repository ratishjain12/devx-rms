import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { Seniority } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || ""; // General search query
    const seniority = searchParams.get("seniority"); // Filter by seniority
    const skill = searchParams.get("skill"); // Filter by skill
    const role = searchParams.get("role"); // Filter by role

    const employees = await prisma.employee.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { skills: { has: query } }, // Filter by skill name
                  { roles: { has: query } }, // Filter by role name
                ],
              }
            : {},
          seniority && seniority !== "ALL"
            ? { seniority: seniority as Seniority }
            : {},
          skill && skill !== "ALL" ? { skills: { has: skill } } : {},
          role && role !== "ALL" ? { roles: { has: role } } : {},
        ],
      },
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
    console.error("Error searching employees:", error);
    return NextResponse.json(
      { error: "Failed to search employees" },
      { status: 500 }
    );
  }
}
