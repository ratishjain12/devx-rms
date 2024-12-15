import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, status, tools } = body;

    const project = await prisma.project.create({
      data: {
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        tools,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
