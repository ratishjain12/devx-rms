import prisma from "@/db/db.config";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // First, delete all assignments associated with the project
    await prisma.assignment.deleteMany({
      where: { projectId: id },
    });

    // Then, delete the project
    await prisma.project.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Deleted project successfully" });
  } catch (error) {
    console.error("Failed to delete project and its assignments:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
