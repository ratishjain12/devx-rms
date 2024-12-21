import { NextResponse } from "next/server";
import prisma from "@/db/db.config";

export async function GET() {
  const types = await prisma.type.findMany();
  return NextResponse.json(types);
}
