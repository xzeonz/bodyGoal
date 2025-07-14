"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function saveOnboardingData(formData) {
  try {
    const userId = "user_dummy_123";

    await prisma.user.create({
      data: {
        id: userId,
        email: formData.get("email"),
        name: formData.get("name"),
        goal: {
          create: {
            initialWeight: parseFloat(formData.get("initialWeight")),
            targetWeight: parseFloat(formData.get("targetWeight")),
            durationWeeks: parseInt(formData.get("durationWeeks")),
          },
        },
      },
    });

    console.log("✅ Aksi saveOnboardingData BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi saveOnboardingData GAGAL:", error);
  }
}

export async function getUserData() {
  const userId = "user_dummy_123";

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        goal: true,
        mealLogs: true,
        workLogs: true,
        weightLog: true,
      },
    });
    console.log("✅ Aksi getUserData BERHASIL.");
    return user;
  } catch (error) {
    console.error("❌ Aksi getUserData GAGAL:", error);
    return null;
  }
}

export async function logWeight(formData) {
  const userId = "user_dummy_123";
  try {
    await prisma.weightLog.create({
      data: {
        weight: parseFloat(formData.get("weight")),
        date: new Date(),
        user: {
          connect: { id: userId },
        },
      },
    });
    revalidatePath("/dashboard/progress");
    console.log("✅ Aksi logWeight BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi logWeight GAGAL:", error);
  }
}

export async function logMeal(mealLogId, newStatus) {
  try {
    await prisma.mealLog.update({
      where: { id: mealLogId },
      data: { status: newStatus },
    });
    revalidatePath("/dashboard/meal");
    console.log(`✅ Aksi logMeal untuk ID ${mealLogId} BERHASIL.`);
  } catch (error) {
    console.error("❌ Aksi logMeal GAGAL:", error);
  }
}

export async function logWorkout(workoutLogId, newStatus) {
  try {
    await prisma.workoutLog.update({
      where: { id: workoutLogId },
      data: { status: newStatus },
    });
    revalidatePath("/dashboard/plan");
    console.log(`✅ Aksi logWorkout untuk ID ${workoutLogId} BERHASIL.`);
  } catch (error) {
    console.error("❌ Aksi logWorkout GAGAL:", error);
  }
}
