import prisma from "@/db/db.config";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Start a transaction to ensure all operations are performed or none
    const deletedProject = await prisma.$transaction(async (prisma) => {
      // Delete all project requirements associated with the project
      await prisma.projectRequirement.deleteMany({
        where: { projectId: id },
      });

      // Delete all assignments associated with the project
      await prisma.assignment.deleteMany({
        where: { projectId: id },
      });

      // Finally, delete the project
      const deletedProject = await prisma.project.delete({
        where: { id: id },
      });

      return deletedProject;
    });

    return NextResponse.json({
      message: "Deleted project successfully",
      deletedProject,
    });
  } catch (error) {
    console.error("Failed to delete project and its associated data:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Transform the data to match the expected format
    const transformedProject = {
      ...project,
    };

    return NextResponse.json(transformedProject);
  } catch (error) {
    console.error("Error fetching project:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
