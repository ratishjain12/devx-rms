import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { name, seniority, skills } = body;

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        seniority,
        skills: Array.isArray(skills) ? skills : [], // Ensure skills is an array
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // First, delete all assignments associated with this employee
    await prisma.assignment.deleteMany({
      where: { employeeId: id },
    });

    // Then, delete the employee
    const deletedEmployee = await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json(deletedEmployee);
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
