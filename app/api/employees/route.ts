import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, seniority, skills, roles } = body;

    const employee = await prisma.employee.create({
      data: {
        name,
        seniority,
        skills,
        roles,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Failed to create employee:", error);
      return NextResponse.json(
        { error: "Failed to create employee" },
        { status: 500 }
      );
    }

    throw error;
  }
}

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
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(employees);
  } catch (error: unknown) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Failed to fetch employees:", error);
      return NextResponse.json(
        { error: "Failed to fetch employees" },
        { status: 500 }
      );
    }

    throw error;
  }
}
