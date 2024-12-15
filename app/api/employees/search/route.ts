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
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { skills: { has: query } },
            ],
          },
          seniority ? { seniority: seniority as Seniority } : {},
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
    return NextResponse.json(
      { error: "Failed to search employees" },
      { status: 500 }
    );
  }
}
