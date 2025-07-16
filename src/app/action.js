"use server";

import { openai } from "@/utils/openai";

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

export async function uploadDummyPhoto() {
  // Simulasi upload ke Cloudflare R2, kembalikan URL dummy
  const url =
    "https://www.unsulbarnews.com/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-12-at-08.38.20.jpeg";
  return { url };
}
