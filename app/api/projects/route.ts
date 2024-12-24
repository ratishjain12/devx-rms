import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { ProjectRequirement, ProjectStatus, Seniority } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = (searchParams.get("status") as ProjectStatus | "ALL") || "ALL";

  try {
    const projects = await prisma.project.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        ...(status !== "ALL" ? { status: status as ProjectStatus } : {}),
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        projectRequirements: {
          include: {
            role: true,
          },
        },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, status, tools, startDate, endDate, projectRequirements } =
      body;

    const newProject = await prisma.project.create({
      data: {
        name,
        status,
        tools,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        projectRequirements: {
          create: projectRequirements.map(
            (req: {
              roleId: string;
              seniority: Seniority;
              startDate: string;
              endDate: string;
              quantity: string;
            }) => ({
              roleId: parseInt(req.roleId),
              seniority: req.seniority,
              startDate: new Date(req.startDate),
              endDate: new Date(req.endDate),
              quantity: parseInt(req.quantity),
            })
          ),
        },
      },
      include: {
        projectRequirements: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json(newProject);
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { name, status, tools, startDate, endDate, projectRequirements } =
      body;

    const updatedProject = await prisma.$transaction(async (prisma) => {
      // Update the project
      await prisma.project.update({
        where: { id: parseInt(id) },
        data: {
          name,
          status,
          tools,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      // Delete existing project requirements
      await prisma.projectRequirement.deleteMany({
        where: { projectId: parseInt(id) },
      });

      // Create new project requirements
      if (projectRequirements && projectRequirements.length > 0) {
        await prisma.projectRequirement.createMany({
          data: projectRequirements.map((req: ProjectRequirement) => ({
            projectId: parseInt(id),
            roleId: req.roleId,
            seniority: req.seniority,
            startDate: new Date(req.startDate),
            endDate: new Date(req.endDate),
            quantity: req.quantity,
          })),
        });
      }

      // Fetch the updated project with its requirements
      return prisma.project.findUnique({
        where: { id: parseInt(id) },
        include: {
          projectRequirements: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
