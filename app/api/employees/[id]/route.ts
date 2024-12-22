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
