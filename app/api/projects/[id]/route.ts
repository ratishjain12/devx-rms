import prisma from "@/db/db.config";
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
