"use server";

import { getSession, logout as authLogout } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToday } from "@/lib/getToday";
import { openai } from "@/utils/openai"; // Pastikan path ini benar
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// =================================================================
// HELPERS
// =================================================================

// Fungsi untuk menghitung kalori target berdasarkan data user
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

// Fungsi untuk memberikan saran fallback jika panggilan AI gagal
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
  };
  return (
    fallbacks[suggestionType] || [
      "Stay consistent!",
      "Small steps lead to big changes.",
    ]
  );
}

// =================================================================
// AUTH & ONBOARDING ACTIONS
// =================================================================

// Fungsi untuk mendaftarkan pengguna baru
export async function registerUser(formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect("/register?error=user-exists");
  }

  await prisma.user.create({
    data: { name, email, password },
  });

  redirect("/login");
}

// Fungsi untuk login pengguna
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
      maxAge: 60 * 60 * 24 * 7,
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

// Fungsi untuk logout pengguna
export async function logoutUser() {
  await authLogout(); // Memanggil fungsi logout dari lib/auth
  redirect("/login");
}

// Fungsi untuk menyimpan data onboarding awal pengguna
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
    // Mungkin tambahkan redirect dengan error message jika gagal
    return;
  }
  redirect("/onboarding/goal");
}

// =================================================================
// DASHBOARD ACTIONS
// =================================================================

// Fungsi untuk menambahkan catatan makanan harian
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
  revalidatePath("/dashboard/meals"); // Revalidate halaman meals
  revalidatePath("/dashboard/overview"); // Revalidate halaman overview
}

// Fungsi untuk menambahkan catatan olahraga harian
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
  revalidatePath("/dashboard/workouts"); // Revalidate halaman workouts
  revalidatePath("/dashboard/overview"); // Revalidate halaman overview
}

// Fungsi untuk menambahkan catatan berat badan harian
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
  revalidatePath("/dashboard/progress"); // Revalidate halaman progress
  revalidatePath("/dashboard/overview"); // Revalidate halaman overview
}

// Fungsi untuk menghasilkan rencana makan dan olahraga AI
export async function generateAIPlan(formData) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
    return;
  }

  const isOnboarding = formData.get("age"); // Digunakan untuk mendeteksi apakah berasal dari form onboarding

  // Jika berasal dari form onboarding, simpan/update data onboarding
  if (isOnboarding) {
    await prisma.onboarding.upsert({
      where: { userId: session.user.id },
      update: {
        age: parseInt(formData.get("age")),
        height: parseInt(formData.get("height")), // <-- PERBAIKAN: Menggunakan 'height' dari formData
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

  // Ambil data user dan onboarding terbaru, termasuk aiPlan untuk caching
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { onboarding: true, aiPlan: true }, // Include aiPlan di sini
  });

  if (!user?.onboarding) {
    // Jika data onboarding tidak ada setelah upsert, ada masalah. Redirect.
    redirect("/dashboard/plan?error=onboarding_data_missing");
    return;
  }

  // --- Logika Caching AI Plan ---
  const now = new Date();
  const cacheThreshold = new Date(
    now.getTime() - CACHE_DURATION_HOURS * 60 * 60 * 1000
  ); // Menggunakan CACHE_DURATION_HOURS global

  // Cek jika plan sudah ada dan masih baru (dalam periode cache)
  if (
    user.aiPlan &&
    user.aiPlan.generatedAt &&
    user.aiPlan.generatedAt > cacheThreshold
  ) {
    console.log("Returning AI Plan from cache (recently generated).");
    revalidatePath("/dashboard", "layout"); // Revalidate layout untuk memastikan data terbaru
    if (isOnboarding) {
      redirect("/dashboard"); // <-- REDIRECT KE /dashboard SETELAH ONBOARDING
    } else {
      // Jika tombol "Buat Rencana Baru" diklik dari dashboard/plan
      redirect("/dashboard/plan?generated=true");
    }
    return; // Hentikan eksekusi jika sudah di-cache
  }
  // --- Akhir Logika Caching AI Plan ---

  const targetCalories = calculateCalories(
    user.onboarding.currentWeight,
    user.onboarding.height,
    user.onboarding.age,
    user.onboarding.gender,
    user.onboarding.activityLevel,
    user.onboarding.goal
  );

  try {
    // Panggilan OpenAI dengan response_format: { type: "json_object" }
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional fitness coach. Create a daily plan. Return ONLY a JSON object with this structure: {"mealPlan": [{"name": string, "calories": number, "description": string}], "workoutPlan": [{"name": string, "duration": number, "description": string}]}. Do NOT include any other text or formatting outside the JSON object.`,
        },
        {
          role: "user",
          content: `Data: Gender: ${user.onboarding.gender}, Age: ${user.onboarding.age}, Height: ${user.onboarding.height}cm, Weight: ${user.onboarding.currentWeight}kg, Activity: ${user.onboarding.activityLevel}, Goal: ${user.onboarding.goal}, Target Calories: ${targetCalories}.`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }, // <--- INI PENTING! PASTIKAN ADA
    });

    let rawContent = completion.choices[0].message.content;
    console.log("OpenAI raw response content for AI Plan:", rawContent); // <-- DEBUGGING: Lihat respons mentah AI
    let aiPlan;
    try {
      // Membersihkan potensi backtick atau teks lain yang tidak diinginkan
      const cleanedContent = rawContent.trim().replace(/```json|```/g, "");
      aiPlan = JSON.parse(cleanedContent); // <--- PARSING DENGAN TRY-CATCH
    } catch (parseError) {
      console.error("Failed to parse AI Plan response into JSON:", parseError);
      console.error("Problematic raw content for AI Plan:", rawContent);
      throw new Error("Invalid AI response format for plan generation."); // Lempar error ke catch block luar
    }

    // Validasi struktur aiPlan yang diharapkan
    if (
      !aiPlan ||
      !Array.isArray(aiPlan.mealPlan) ||
      !Array.isArray(aiPlan.workoutPlan)
    ) {
      console.error("AI Plan structure invalid:", aiPlan);
      throw new Error("AI Plan did not return expected structure.");
    }

    // Menyimpan/mengupdate AI Plan ke database
    await prisma.aiPlan.upsert({
      where: { userId: session.user.id },
      update: {
        mealPlan: JSON.stringify(aiPlan.mealPlan), // <--- PASTIKAN JSON.stringify() DI SINI
        workoutPlan: JSON.stringify(aiPlan.workoutPlan), // <--- PASTIKAN JSON.stringify() DI SINI
        generatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        mealPlan: JSON.stringify(aiPlan.mealPlan), // <--- PASTIKAN JSON.stringify() DI SINI
        workoutPlan: JSON.stringify(aiPlan.workoutPlan), // <--- PASTIKAN JSON.stringify() DI SINI
        generatedAt: new Date(), // <--- PASTIKAN INI DISET SAAT CREATE BARU
      },
    });

    revalidatePath("/dashboard", "layout"); // Revalidate seluruh dashboard

    if (isOnboarding) {
      redirect("/dashboard"); // Redirect ke dashboard setelah onboarding
    } else {
      redirect("/dashboard/plan?generated=true");
    }
  } catch (error) {
    console.error("AI Plan generation failed:", error);
    // Redirect dengan pesan error yang di-encode
    redirect(
      `/dashboard/plan?error=${encodeURIComponent(
        error.message || "An unknown error occurred during plan generation."
      )}`
    );
  }
}

// Fungsi untuk mengajukan pertanyaan ke AI Coach
export async function askCoach(formData) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const message = formData.get("message");
  if (!message) {
    redirect("/dashboard/coach?error=Message+is+required");
    return;
  }

  let aiResponse = null;
  let aiError = null;

  try {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional fitness coach. Use the user's data to provide helpful, personalized, encouraging, and actionable advice.`,
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
      // response_format: { type: "text" }, // Opsional: Jika Anda yakin AI hanya mengembalikan teks biasa
    });

    aiResponse = completion.choices[0].message.content;
  } catch (error) {
    console.error("AI Coach failed:", error);
    aiError = error.message || "An unknown error occurred.";
  }
  if (aiError) {
    redirect(`/dashboard/coach?error=${encodeURIComponent(aiError)}`);
  } else {
    redirect(`/dashboard/coach?response=${encodeURIComponent(aiResponse)}`);
  }
}

// Fungsi untuk menghasilkan saran AI (makanan atau olahraga)
export async function generateAISuggestions(
  userData,
  currentData,
  suggestionType
) {
  "use server";
  try {
    // 1. Cek cache di database terlebih dahulu
    const user = await prisma.user.findUnique({ where: { id: userData.id } }); // Asumsi userData.id adalah ID user
    if (!user) {
      console.warn("User not found for AI suggestions caching.");
      return getFallbackSuggestions(suggestionType);
    }

    const cachedSuggestion = await prisma.aISuggestion.findFirst({
      where: {
        userId: user.id,
        type: suggestionType,
        generatedAt: {
          gte: new Date(Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000), // Dalam rentang waktu cache
        },
      },
      orderBy: { generatedAt: "desc" }, // Ambil yang terbaru
    });

    if (cachedSuggestion) {
      console.log("Returning AI suggestions from cache.");
      try {
        // Pastikan data yang di-cache adalah JSON valid
        const parsedSuggestions = JSON.parse(cachedSuggestion.suggestions);
        if (Array.isArray(parsedSuggestions)) {
          return parsedSuggestions;
        } else {
          console.warn("Cached suggestions not a valid array, regenerating.");
        }
      } catch (parseError) {
        console.error("Failed to parse cached AI suggestions:", parseError);
      }
    }

    // 2. Jika tidak ada di cache atau cache sudah kadaluarsa, panggil OpenAI API
    console.log("Generating new AI suggestions from OpenAI...");
    const messages = [
      {
        role: "system",
        content: `You are a professional fitness and nutrition coach. Provide personalized suggestions. Your response MUST be a valid JSON array of 2-3 suggestion strings. Example: ["Suggestion 1", "Suggestion 2"]. Do NOT include any other text or formatting outside the JSON array.`,
      },
      {
        role: "user",
        content: `User Profile: Gender: ${userData.gender}, Age: ${
          userData.age
        }, Goal: ${userData.goal}. Current Data: ${JSON.stringify(
          currentData
        )}. Provide ${suggestionType} suggestions as a JSON array of strings.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      response_format: { type: "json_object" }, // Pastikan ini ada
    });

    let rawContent = completion.choices[0].message.content;
    let suggestions;

    try {
      const cleanedContent = rawContent.trim().replace(/```json|```/g, "");
      suggestions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response into JSON:", parseError);
      console.error("Problematic raw content:", rawContent);
      return getFallbackSuggestions(suggestionType);
    }

    if (!Array.isArray(suggestions)) {
      console.error("AI response was not an array:", suggestions);
      return getFallbackSuggestions(suggestionType);
    }

    const validSuggestions = suggestions
      .filter((s) => typeof s === "string")
      .slice(0, 3);

    // 3. Simpan hasil baru ke cache database
    await prisma.aISuggestion.create({
      data: {
        userId: user.id,
        type: suggestionType,
        suggestions: validSuggestions, // Prisma akan otomatis stringify jika tipe `Json`
        generatedAt: new Date(),
      },
    });

    return validSuggestions;
  } catch (error) {
    console.error("AI Suggestions generation failed:", error);
    return getFallbackSuggestions(suggestionType);
  }
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
