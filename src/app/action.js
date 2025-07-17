"use server";

import { openai } from "../utils/openai";
import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OpenAI } from "openai";

export async function saveOnboardingData(formData) {
  try {
    const userId = "user_dummy_123";

    // Create user first if not exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "dummy@example.com",
        name: "Dummy User",
        password: "dummy123", // Add required password field
      },
    });

    // Create or update onboarding data
    await prisma.onboarding.upsert({
      where: { userId: userId },
      update: {
        gender: formData.get("gender"),
        age: parseInt(formData.get("age")),
        height: parseInt(formData.get("height")),
        currentWeight: parseFloat(formData.get("currentWeight")),
        activityLevel: formData.get("activityLevel"),
      },
      create: {
        userId: userId,
        gender: formData.get("gender"),
        age: parseInt(formData.get("age")),
        height: parseInt(formData.get("height")),
        currentWeight: parseFloat(formData.get("currentWeight")),
        activityLevel: formData.get("activityLevel"),
      },
    });

    console.log("✅ Aksi saveOnboardingData BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi saveOnboardingData GAGAL:", error);
    return;
  }
  
  // Redirect outside try-catch to avoid NEXT_REDIRECT error
  redirect("/onboarding/goal");
}

export async function saveFitnessGoal(formData) {
  try {
    const userId = "user_dummy_123";
    const goal = formData.get("goal");

    await prisma.onboarding.update({
      where: { userId: userId },
      data: { goal: goal },
    });

    console.log("✅ Aksi saveFitnessGoal BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi saveFitnessGoal GAGAL:", error);
    return;
  }
  
  // Redirect outside try-catch to avoid NEXT_REDIRECT error
  redirect("/dashboard");
}

export async function getUserData() {
  const userId = "user_dummy_123";

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        goal: true,
        mealLogs: true,
        workoutLogs: true,
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
    // ✅ BARIS 115 - BENAR (dengan backticks)
    console.log(`✅ Aksi logMeal untuk ID ${mealLogId} BERHASIL.`);
    
    // ✅ BARIS 130 - BENAR (dengan backticks)
    console.log(`✅ Aksi logWorkout untuk ID ${workoutLogId} BERHASIL.`);
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
export async function registerUser(formData) {
  "use server";
  
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    redirect("/register?error=user-exists");
  }
  
  // Create user with plain password
  await prisma.user.create({
    data: {
      name,
      email,
      password, // Plain text password as requested
    },
  });
  
  console.log("✅ User registration successful:", email);
  redirect("/onboarding");
}

export async function loginUser(formData) {
  "use server";
  
  const { cookies } = await import('next/headers');
  
  const email = formData.get("email");
  const password = formData.get("password");
  
  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }
  
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  // Compare plain text password
  if (!user || user.password !== password) {
    redirect("/login?error=invalid-credentials");
  }
  
  // Set session cookie untuk manual login
  const cookieStore = await cookies();
  cookieStore.set('user-session', JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  });
  
  console.log("✅ User login successful:", email);
  
  // Check if user has completed onboarding
  const userWithOnboarding = await prisma.user.findUnique({
    where: { id: user.id },
    include: { onboarding: true },
  });
  
  // Redirect to onboarding if not completed, otherwise to dashboard
  if (!userWithOnboarding?.onboarding) {
    redirect("/onboarding");
  } else {
    redirect("/dashboard");
  }
}

export async function logoutUser() {
  "use server";
  
  const { logout } = await import('../lib/auth');
  
  // Hapus semua session cookies
  await logout();
  
  redirect("/login");
}

export async function testOpenAIKey() {
  console.log("🧪 Memulai tes koneksi ke OpenAI...");

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Key OPENAI_API_KEY tidak ditemukan di file .env");
    return { success: false, error: "API Key not found." };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Katakan 'Hello World!'" }],
    });

    console.log("✅ Koneksi dan API Key OpenAI BERHASIL.");
    console.log("Jawaban dari AI:", response.choices[0].message.content);
    return { success: true, message: response.choices[0].message.content };
  } catch (error) {
    console.error("❌ Koneksi atau API Key OpenAI GAGAL:", error.message);
    return { success: false, error: error.message };
  }
}
export async function askCoach(formData) {
  const message = formData.get("message");

  if (!message) throw new Error("Message is required");

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a fitness coach who helps users achieve their body goals using diet, workout, and motivation. Always answer clearly, with optional emojis.",
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return completion.choices?.[0]?.message?.content || "No response";
}

export async function generatePlan(formData) {
  const beratAwal = Number(formData.get("beratAwal"));
  const beratTarget = Number(formData.get("beratTarget"));
  const durasiMinggu = Number(formData.get("durasiMinggu"));
  const goal = formData.get("goal");

  if (
    !beratAwal ||
    !beratTarget ||
    !durasiMinggu ||
    !goal ||
    isNaN(beratAwal) ||
    isNaN(beratTarget) ||
    isNaN(durasiMinggu)
  ) {
    throw new Error("Field tidak lengkap atau tidak valid");
  }

  const defisitKalori =
    goal === "cutting" ? 0.8 : goal === "bulking" ? 1.15 : 1;
  const bmr = beratAwal * 24;
  const dailyCalories = Math.round(bmr * defisitKalori);

  const workoutStyle =
    goal === "cutting"
      ? "HIIT"
      : goal === "bulking"
      ? "Strength Training"
      : "Balanced";

  const mealType =
    goal === "cutting"
      ? "High protein, low carb"
      : goal === "bulking"
      ? "High carb, calorie dense"
      : "Balanced meal";

  return {
    dailyCalories,
    workoutStyle,
    mealType,
  };
}

export async function addMealLog(formData) {
  const userId = "user_dummy_123";
  try {
    await prisma.mealLog.create({
      data: {
        slot: formData.get("slot"),
        date: new Date(formData.get("date")),
        status: false,
        user: {
          connect: { id: userId },
        },
      },
    });
    revalidatePath("/dashboard/meal");
    console.log("✅ Aksi addMealLog BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi addMealLog GAGAL:", error);
  }
}

export async function addWorkoutLog(formData) {
  const userId = "user_dummy_123";
  try {
    await prisma.workoutLog.create({
      data: {
        exercise: formData.get("exercise"),
        sets: parseInt(formData.get("sets")) || 3,
        reps: parseInt(formData.get("reps")) || 10,
        weight: parseFloat(formData.get("weight")) || 0,
        date: new Date(formData.get("date")),
        status: false,
        user: {
          connect: { id: userId },
        },
      },
    });
    revalidatePath("/dashboard/plan");
    console.log("✅ Aksi addWorkoutLog BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi addWorkoutLog GAGAL:", error);
  }
}

export async function uploadDummyPhoto() {
  // Simulasi upload ke Cloudflare R2, kembalikan URL dummy
  const url =
    "https://www.unsulbarnews.com/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-12-at-08.38.20.jpeg";
  return { url };
}
