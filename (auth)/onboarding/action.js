"use server";

import { redirect } from "next/navigation";
import prisma from "lib/prisma";

export async function saveInitialData(formData) {
  const data = Object.fromEntries(formData);

  await prisma.Onboarding.create({
    data: {
      gender: data.gender,
      age: parseInt(data.age),
      height: parseFloat(data.height),
      currentWeight: parseFloat(data.currentWeight),
      activityLevel: data.activityLevel,
    },
  });

  redirect("/onboarding/goal");
}
