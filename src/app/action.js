"use server";

import { getSession, logout as authLogout } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToday } from "@/lib/getToday";
import { openai } from "@/utils/openai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// =================================================================
// HELPERS
// =================================================================

// Menggunakan versi detail dari file action.js baru
function calculateCalories(weight, height, age, gender, activityLevel, goal) {
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);
  if (goal?.toLowerCase().includes("lose")) {
    return Math.round(tdee - 500);
  } else if (goal?.toLowerCase().includes("gain")) {
    return Math.round(tdee + 300);
  } else {
    return Math.round(tdee);
  }
}

function getFallbackSuggestions(suggestionType) {
  const fallbacks = {
    "meal and nutrition": [
      "Focus on balanced meals.",
      "Plan your meals ahead.",
      "Include more vegetables.",
    ],
    "workout and exercise": [
      "Mix cardio and strength training.",
      "Listen to your body and rest.",
      "Stay consistent, even on busy days.",
    ],
    // Tambahkan fallback lain jika perlu
  };
  return (
    fallbacks[suggestionType] || [
      "Stay consistent!",
      "Small steps lead to big changes.",
    ]
  );
}

// =================================================================
// AUTH & ONBOARDING ACTIONS (dari action.js baru)
// =================================================================

export async function registerUser(formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect("/register?error=user-exists");
  }

  await prisma.user.create({
    data: { name, email, password }, // Password masih plain text sesuai permintaan
  });

  redirect("/onboarding");
}

export async function loginUser(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) redirect("/login?error=missing-fields");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password)
    redirect("/login?error=invalid-credentials");

  const cookieStore = cookies();
  cookieStore.set(
    "user-session",
    JSON.stringify({ id: user.id, email: user.email, name: user.name }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      sameSite: "lax",
    }
  );

  const userWithOnboarding = await prisma.user.findUnique({
    where: { id: user.id },
    include: { onboarding: true },
  });

  if (!userWithOnboarding?.onboarding) {
    redirect("/onboarding");
  } else {
    redirect("/dashboard");
  }
}

export async function logoutUser() {
  await authLogout(); // Menggunakan fungsi logout dari lib/auth
  redirect("/login");
}

// Menyimpan data onboarding langkah pertama
export async function saveOnboardingData(formData) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  try {
    await prisma.onboarding.create({
      data: {
        userId: session.user.id,
        gender: formData.get("gender"),
        age: parseInt(formData.get("age")),
        height: parseInt(formData.get("height")),
        currentWeight: parseFloat(formData.get("currentWeight")),
        activityLevel: formData.get("activityLevel"),
      },
    });
  } catch (error) {
    console.error("Save Onboarding Data failed:", error);
    // Mungkin redirect ke halaman error
    return;
  }
  redirect("/onboarding/goal");
}

// =================================================================
// DASHBOARD ACTIONS (Gabungan terbaik dari kedua file)
// =================================================================

// Menggunakan nama standar 'addMeal' dengan logic dari 'logMeal'
export async function addMeal(formData) {
  const session = await getSession();
  if (!session?.user) return;

  const name = formData.get("name");
  const calories = parseInt(formData.get("calories"));
  if (!name || isNaN(calories)) return;

  await prisma.meal.create({
    data: {
      userId: session.user.id,
      name,
      calories,
      date: getToday(),
    },
  });
  // Revalidate path yang relevan dengan struktur baru
  revalidatePath("/dashboard/meals");
  revalidatePath("/dashboard/overview");
}

// Menggunakan nama standar 'addWorkout' dengan logic dari 'logWorkout'
export async function addWorkout(formData) {
  const session = await getSession();
  if (!session?.user) return;

  const name = formData.get("name");
  const duration = parseInt(formData.get("duration"));
  if (!name || isNaN(duration)) return;

  await prisma.workout.create({
    data: {
      userId: session.user.id,
      name,
      duration,
      date: getToday(),
    },
  });
  revalidatePath("/dashboard/workouts");
  revalidatePath("/dashboard/overview");
}

// Menggunakan nama standar 'addWeight' dengan logic dari 'logWeight'
export async function addWeight(formData) {
  const session = await getSession();
  if (!session?.user) return;

  const weight = parseFloat(formData.get("weight"));
  if (isNaN(weight)) return;

  await prisma.weight.create({
    data: {
      userId: session.user.id,
      weight,
      date: getToday(),
    },
  });
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/overview");
}

// Versi `generateAIPlan` yang sesuai dengan UI dashboard (dari dashboard/page.js)
export async function generateAIPlan(formData) {
  const session = await getSession();
  if (!session?.user) return;

  const isOnboarding = formData.get("age"); // Cek apakah ini dari form onboarding

  if (isOnboarding) {
    await prisma.onboarding.upsert({
      where: { userId: session.user.id },
      update: {
        age: parseInt(formData.get("age")),
        height: parseInt(formData.get("height")),
        currentWeight: parseFloat(formData.get("currentWeight")),
        targetWeight: parseFloat(formData.get("targetWeight")),
        gender: formData.get("gender"),
        activityLevel: formData.get("activityLevel"),
        goal: formData.get("goal"),
      },
      create: {
        userId: session.user.id,
        age: parseInt(formData.get("age")),
        height: parseInt(formData.get("height")),
        currentWeight: parseFloat(formData.get("currentWeight")),
        targetWeight: parseFloat(formData.get("targetWeight")),
        gender: formData.get("gender"),
        activityLevel: formData.get("activityLevel"),
        goal: formData.get("goal"),
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { onboarding: true },
  });

  if (!user?.onboarding) return;

  const targetCalories = calculateCalories(
    user.onboarding.currentWeight,
    user.onboarding.height,
    user.onboarding.age,
    user.onboarding.gender,
    user.onboarding.activityLevel,
    user.onboarding.goal
  );

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional fitness coach. Create a daily plan. Return ONLY a JSON object with this structure: {"mealPlan": [{"name": string, "calories": number, "description": string}], "workoutPlan": [{"name": string, "duration": number, "description": string}]}`,
        },
        {
          role: "user",
          content: `Data: Gender: ${user.onboarding.gender}, Age: ${user.onboarding.age}, Height: ${user.onboarding.height}cm, Weight: ${user.onboarding.currentWeight}kg, Activity: ${user.onboarding.activityLevel}, Goal: ${user.onboarding.goal}, Target Calories: ${targetCalories}.`,
        },
      ],
      temperature: 0.7,
    });

    const aiPlan = JSON.parse(completion.choices[0].message.content);

    await prisma.aiPlan.upsert({
      where: { userId: session.user.id },
      update: {
        mealPlan: JSON.stringify(aiPlan.mealPlan),
        workoutPlan: JSON.stringify(aiPlan.workoutPlan),
        generatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        mealPlan: JSON.stringify(aiPlan.mealPlan),
        workoutPlan: JSON.stringify(aiPlan.workoutPlan),
      },
    });

    revalidatePath("/dashboard", "layout"); // Revalidate seluruh layout dashboard

    if (isOnboarding) {
      redirect("/dashboard/plan?generated=true");
    }
  } catch (error) {
    console.error("AI Plan generation failed:", error);
  }
}

// Versi `askCoach` yang detail dan menggunakan data user (dari dashboard/page.js)
export async function askCoach(formData) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const message = formData.get("message");
  if (!message) {
    redirect("/dashboard/coach?error=No+message+provided");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      onboarding: true,
      meals: {
        where: { date: getToday() },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      workouts: {
        where: { date: getToday() },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      weights: { orderBy: { date: "desc" }, take: 3 },
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional fitness and nutrition coach. Use the user's data to provide helpful, personalized, encouraging, and actionable advice.`,
        },
        {
          role: "user",
          content: `User Profile: Name: ${user.name}, Gender: ${
            user.onboarding?.gender || "N/A"
          }, Age: ${user.onboarding?.age || "N/A"}, Goal: ${
            user.onboarding?.goal || "N/A"
          }.
Recent Activity: Today's Meals: ${JSON.stringify(
            user.meals
          )}, Today's Workouts: ${JSON.stringify(
            user.workouts
          )}, Recent Weights: ${JSON.stringify(user.weights)}.
User Question: ${message}`,
        },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    redirect(`/dashboard/coach?response=${encodeURIComponent(response)}`);
  } catch (error) {
    console.error("AI Coach failed:", error);
    redirect(
      `/dashboard/coach?error=${encodeURIComponent(
        error.message || "Unknown error"
      )}`
    );
  }
}

// Aksi untuk suggestion, diperlukan oleh beberapa halaman
export async function generateAISuggestions(
  userData,
  currentData,
  suggestionType
) {
  "use server";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional fitness and nutrition coach. Provide personalized suggestions. Return ONLY a valid JSON array of 2-3 suggestion strings.`,
        },
        {
          role: "user",
          content: `User Profile: Gender: ${userData.gender}, Age: ${
            userData.age
          }, Goal: ${userData.goal}. Current Data: ${JSON.stringify(
            currentData
          )}. Provide ${suggestionType} suggestions as a JSON array of strings.`,
        },
      ],
      temperature: 0.7,
    });

    let content = completion.choices[0].message.content
      .trim()
      .replace(/```json|```/g, "");
    const suggestions = JSON.parse(content);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error("AI Suggestions generation failed:", error);
    return getFallbackSuggestions(suggestionType);
  }
}
