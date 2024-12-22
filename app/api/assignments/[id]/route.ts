import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await params;
    const id = parseInt(data.id);

    const deletedAssignment = await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json(deletedAssignment);
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await params;
    const id = parseInt(data.id, 10);
    const body = await request.json();
    const { employeeId, projectId, startDate, endDate, utilisation } = body;

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        employeeId: parseInt(employeeId, 10),
        projectId: parseInt(projectId, 10),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        utilisation,
      },
      include: {
        employee: true,
        project: true,
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}
