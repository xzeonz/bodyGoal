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
