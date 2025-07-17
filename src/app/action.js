"use server";

import { openai } from "../utils/openai";
import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OpenAI } from "openai";
import { getSession } from "../lib/auth";

// Helper function untuk menghitung target kalori
function calculateCalories(weight, height, age, gender, activityLevel, goal) {
  // Hitung BMR menggunakan Mifflin-St Jeor Equation
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very active": 1.9,
  };

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

  // Adjust berdasarkan goal
  if (goal.toLowerCase().includes("lose") || goal.toLowerCase().includes("weight loss")) {
    return Math.round(tdee - 500); // Deficit 500 kalori untuk weight loss
  } else if (goal.toLowerCase().includes("gain") || goal.toLowerCase().includes("muscle")) {
    return Math.round(tdee + 300); // Surplus 300 kalori untuk muscle gain
  } else {
    return Math.round(tdee); // Maintenance untuk toning/general fitness
  }
}

export async function saveOnboardingData(formData) {
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    const gender = formData.get("gender");
    const age = parseInt(formData.get("age"));
    const height = parseInt(formData.get("height"));
    const currentWeight = parseFloat(formData.get("currentWeight"));
    const activityLevel = formData.get("activityLevel");

    await prisma.onboarding.create({
      data: {
        userId: session.user.id,
        gender,
        age,
        height,
        currentWeight,
        activityLevel,
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
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  
  try {
    const goal = formData.get("goal");

    // Update onboarding dengan goal
    await prisma.onboarding.update({
      where: { userId: session.user.id },
      data: { goal: goal },
    });

    // Auto-generate AI plan setelah goal setting
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { onboarding: true },
    });

    if (user?.onboarding) {
      const targetCalories = calculateCalories(
        user.onboarding.currentWeight,
        user.onboarding.height,
        user.onboarding.age,
        user.onboarding.gender,
        user.onboarding.activityLevel,
        user.onboarding.goal
      );

      // Generate AI plan menggunakan OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional fitness and nutrition coach. Create a personalized daily plan based on user data. Return ONLY a JSON object with this exact structure:
{
  "mealPlan": [
    {"name": "Breakfast name", "calories": number, "description": "brief description"},
    {"name": "Lunch name", "calories": number, "description": "brief description"},
    {"name": "Dinner name", "calories": number, "description": "brief description"},
    {"name": "Snack name", "calories": number, "description": "brief description"}
  ],
  "workoutPlan": [
    {"name": "Exercise name", "duration": number, "description": "brief description"},
    {"name": "Exercise name", "duration": number, "description": "brief description"},
    {"name": "Exercise name", "duration": number, "description": "brief description"}
  ]
}`,
          },
          {
            role: "user",
            content: `Create a daily plan for:
- Gender: ${user.onboarding.gender}
- Age: ${user.onboarding.age}
- Height: ${user.onboarding.height}cm
- Weight: ${user.onboarding.currentWeight}kg
- Activity Level: ${user.onboarding.activityLevel}
- Goal: ${user.onboarding.goal}
- Target Calories: ${targetCalories}

Make sure total meal calories approximately match target calories.`,
          },
        ],
        temperature: 0.7,
      });

      const aiPlan = JSON.parse(completion.choices[0].message.content);
      
      // Save AI plan ke database
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
    }

    console.log("✅ Aksi saveFitnessGoal + AI Plan Generation BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi saveFitnessGoal GAGAL:", error);
    return;
  }
  
  // Redirect outside try-catch to avoid NEXT_REDIRECT error
  redirect("/dashboard");
}

export async function getUserData() {
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        onboarding: true,
        meals: true,
        workouts: true,
        weights: true,
        aiPlan: true,
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
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  
  try {
    const weight = parseFloat(formData.get("weight"));
    const date = formData.get("date") || new Date().toISOString().split('T')[0];

    await prisma.weight.create({
      data: {
        userId: session.user.id,
        weight: weight,
        date: new Date(date),
      },
    });
    revalidatePath("/dashboard/progress");
    console.log("✅ Aksi logWeight BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi logWeight GAGAL:", error);
  }
}

export async function logMeal(formData) {
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  
  try {
    const name = formData.get("name");
    const calories = parseInt(formData.get("calories"));
    const date = formData.get("date") || new Date().toISOString().split('T')[0];

    await prisma.meal.create({
      data: {
        userId: session.user.id,
        name: name,
        calories: calories,
        date: new Date(date),
      },
    });
    revalidatePath("/dashboard/meal");
    console.log("✅ Aksi logMeal BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi logMeal GAGAL:", error);
  }
}

export async function logWorkout(formData) {
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  
  try {
    const name = formData.get("name");
    const duration = parseInt(formData.get("duration"));
    const date = formData.get("date") || new Date().toISOString().split('T')[0];

    await prisma.workout.create({
      data: {
        userId: session.user.id,
        name: name,
        duration: duration,
        date: new Date(date),
      },
    });
    revalidatePath("/dashboard/plan");
    console.log("✅ Aksi logWorkout BERHASIL.");
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
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  
  try {
    await prisma.meal.create({
      data: {
        name: formData.get("name") || "Meal",
        calories: parseInt(formData.get("calories")) || 0,
        date: formData.get("date") || new Date().toISOString().split('T')[0],
        userId: session.user.id,
      },
    });
    revalidatePath("/dashboard");
    console.log("✅ Aksi addMealLog BERHASIL.");
  } catch (error) {
    console.error("❌ Aksi addMealLog GAGAL:", error);
  }
}

export async function addWorkoutLog(formData) {
  "use server";
  
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  
  try {
    await prisma.workout.create({
      data: {
        name: formData.get("name") || formData.get("exercise") || "Workout",
        duration: parseInt(formData.get("duration")) || parseInt(formData.get("sets")) * parseInt(formData.get("reps")) || 30,
        date: formData.get("date") || new Date().toISOString().split('T')[0],
        userId: session.user.id,
      },
    });
    revalidatePath("/dashboard");
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
