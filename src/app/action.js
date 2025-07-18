"use server";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function askCoach(formData) {
  const message = formData.get("question");
  if (!message) throw new Error("Message is required");

  const profile = {
    name: "User",
    age: 25,
    gender: "male",
    height: 170,
    weight: 70,
    activityLevel: "moderately active",
  };

  const prompt = `
  You are a fitness coach AI. Answer the user's question clearly.
  User Profile:
  - Name: ${profile.name}
  - Age: ${profile.age}
  - Gender: ${profile.gender}
  - Height: ${profile.height} cm
  - Weight: ${profile.weight} kg
  - Activity Level: ${profile.activityLevel}
  Question: ${message}`;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return chatCompletion.choices[0].message.content;
}

export async function generatePlan(formData) {
  const gender = formData.get("gender");
  const age = parseInt(formData.get("age"));
  const height = parseInt(formData.get("height"));
  const weight = parseFloat(formData.get("weight"));
  const activityLevel = formData.get("activityLevel");
  const goal = formData.get("goal");
  // const durasiMinggu = parseInt(formData.get("durasi"));

  if (!gender) {
    throw new Error("Field 'gender' tidak lengkap atau tidak valid");
  }
  if (!age || isNaN(age)) {
    throw new Error("Field 'age' tidak lengkap atau tidak valid");
  }
  if (!height || isNaN(height)) {
    throw new Error("Field 'height' tidak lengkap atau tidak valid");
  }
  if (!weight || isNaN(weight)) {
    throw new Error("Field 'weight' tidak lengkap atau tidak valid");
  }
  if (!activityLevel) {
    throw new Error("Field 'activityLevel' tidak lengkap atau tidak valid");
  }
  if (!goal) {
    throw new Error("Field 'goal' tidak lengkap atau tidak valid");
  }
  // if (isNaN(durasiMinggu)) {
  //   throw new Error("Field 'durasi' tidak lengkap atau tidak valid");
  // }

  const prompt = `
  Buatkan fitness plan AI berdasarkan profil berikut:

  - Gender: ${gender}
  - Usia: ${age} tahun
  - Tinggi: ${height} cm
  - Berat sekarang: ${weight} kg
  - Aktivitas: ${activityLevel}
  - Goal: ${goal}

  Output yang diminta:
  - Ringkasan strategi
  - Workout plan mingguan
  - Rekomendasi meal per hari (dengan estimasi kalori)
  - Perkiraan progres tiap minggu
  - Tips tambahan sesuai kondisi
  - Durasi program: hitungan minggu
  `;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return chatCompletion.choices[0].message.content;
}