"use server";

import prisma from "@/db/db.config";

export async function addRole(data: { name: string }) {
  const role = await prisma.role.create({
    data: {
      name: data.name,
    },
  });
  return role;
}

export async function addSkill(data: { name: string }) {
  const skill = await prisma.skill.create({
    data: {
      name: data.name,
    },
  });
  return skill;
}

export async function addType(data: { name: string }) {
  const type = await prisma.type.create({
    data: {
      name: data.name,
    },
  });
  return type;
}

export async function deleteRole(id: number) {
  await prisma.role.delete({
    where: { id },
  });
}

export async function deleteSkill(id: number) {
  await prisma.skill.delete({
    where: { id },
  });
}

export async function deleteType(id: number) {
  await prisma.type.delete({
    where: { id },
  });
}
