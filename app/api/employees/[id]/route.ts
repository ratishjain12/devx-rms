import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10); // Get the employee ID from the params
    const body = await request.json(); // Parse the request body
    const { name, seniority, skills, roles } = body; // Destructure necessary fields

    // Validate and prepare skills and roles
    const updatedSkills = Array.isArray(skills) ? skills : []; // Ensure skills is an array
    const updatedRoles = Array.isArray(roles) ? roles : []; // Ensure roles is an array

    // Update employee with the new data
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        seniority,
        skills: updatedSkills, // Update skills
        roles: updatedRoles, // Update roles
      },
    });

    return NextResponse.json(updatedEmployee); // Return the updated employee data
  } catch (error) {
    console.error("Failed to update employee:", error); // Log any errors
    return NextResponse.json(
      { error: "Failed to update employee" }, // Return error response
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await params;
    const id = parseInt(data.id);

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: parseInt(params.id, 10), // Convert string to number
      },
      include: {
        assignments: {
          include: {
            project: true,
          },
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedEmployee = {
      ...employee,
    };

    return NextResponse.json(transformedEmployee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
