"use server";

import { redirect } from "next/navigation";
import prisma from "lib/prisma";

export async function saveFitnessGoal(formData) {
  const data = Object.fromEntries(formData);

  await prisma.userProfile.update({
    where: { id: 1 }, // replace this with actual user ID or session
    data: {
      goal: data.goal,
    },
  });

  redirect("/dashboard");
}
