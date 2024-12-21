import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function GET() {
  const roles = await prisma.role.findMany();
  return NextResponse.json(roles);
}
