import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { Seniority } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const seniority = searchParams.get("seniority");

    const employees = await prisma.employee.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { skills: { has: query } },
                ],
              }
            : {}, // Skip name/skills filter if query is empty
          seniority && seniority !== "ALL"
            ? { seniority: seniority as Seniority }
            : {}, // Filter by seniority unless it's "ALL"
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
