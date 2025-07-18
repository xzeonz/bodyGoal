import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToday } from "@/lib/getToday";
import { calculateCalories } from "@/lib/calculateCalories";
import { evaluateBadge } from "@/lib/evaluateBadge";
import { openai } from "@/utils/openai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logoutUser, uploadProgressPhoto } from "../action";
// Removed QuickAddButton components - using pure server actions now

// Server Actions
async function addWeight(formData) {
  "use server";
  const session = await getSession();
  if (!session?.user) return;

  const weight = parseFloat(formData.get("weight"));
  if (!weight) return;

  await prisma.weight.create({
    data: {
      userId: session.user.id,
      weight,
      date: getToday(),
    },
  });
  revalidatePath("/dashboard");
}

async function addMeal(formData) {
  "use server";
  const session = await getSession();
  if (!session?.user) return;

  const name = formData.get("name");
  const calories = parseInt(formData.get("calories"));
  if (!name || !calories) return;

  await prisma.meal.create({
    data: {
      userId: session.user.id,
      name,
      calories,
      date: getToday(),
    },
  });
  revalidatePath("/dashboard");
}

async function addWorkout(formData) {
  "use server";
  const session = await getSession();
  if (!session?.user) return;

  const name = formData.get("name");
  const duration = parseInt(formData.get("duration"));
  if (!name || !duration) return;

  await prisma.workout.create({
    data: {
      userId: session.user.id,
      name,
      duration,
      date: getToday(),
    },
  });
  revalidatePath("/dashboard");
}

async function generateAIPlan(formData) {
  "use server";
  const session = await getSession();
  if (!session?.user) return;

  // Check if this is onboarding data submission
  const age = formData.get("age");
  const height = formData.get("height");
  const currentWeight = formData.get("currentWeight");
  const targetWeight = formData.get("targetWeight");
  const gender = formData.get("gender");
  const activityLevel = formData.get("activityLevel");
  const goal = formData.get("goal");

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      onboarding: true,
    },
  });

  // If onboarding data is provided, save it
  if (age && height && currentWeight && gender && activityLevel && goal) {
    await prisma.onboarding.upsert({
      where: { userId: session.user.id },
      update: {
        age: parseInt(age),
        height: parseInt(height),
        currentWeight: parseFloat(currentWeight),
        targetWeight: parseFloat(targetWeight),
        gender,
        activityLevel,
        goal,
      },
      create: {
        userId: session.user.id,
        age: parseInt(age),
        height: parseInt(height),
        currentWeight: parseFloat(currentWeight),
        targetWeight: parseFloat(targetWeight),
        gender,
        activityLevel,
        goal,
      },
    });

    // Refresh user data
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        onboarding: true,
      },
    });
  }

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
    
    // Convert AI plan to string format for to-do lists
    const mealPlanString = aiPlan.mealPlan.map(meal => `${meal.name} (${meal.calories} cal)`).join('\n');
    const workoutPlanString = aiPlan.workoutPlan.map(workout => `${workout.name} (${workout.duration} min)`).join('\n');
    
    // Save AI plan to database
    await prisma.aiPlan.upsert({
      where: { userId: session.user.id },
      update: {
        mealPlan: mealPlanString,
        workoutPlan: workoutPlanString,
        generatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        mealPlan: mealPlanString,
        workoutPlan: workoutPlanString,
        generatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    
    // Redirect with success message if this was onboarding
    if (age && height && currentWeight && gender && activityLevel && goal) {
      redirect("/dashboard?tab=plan&generated=true");
    }
  } catch (error) {
    console.error("AI Plan generation failed:", error);
  }
}

// Generate AI Suggestions for each tab
async function generateAISuggestions(userData, currentData, suggestionType) {
  "use server";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional fitness and nutrition coach. Provide personalized suggestions based on user's current progress and goals. Keep suggestions concise, actionable, and motivating. Return ONLY a valid JSON array of 2-3 suggestion strings. Do not include any markdown formatting or code blocks.`,
        },
        {
          role: "user",
          content: `User Profile:
- Gender: ${userData.gender}
- Age: ${userData.age}
- Goal: ${userData.goal}
- Activity Level: ${userData.activityLevel}

Current Data: ${JSON.stringify(currentData)}

Provide ${suggestionType} suggestions as a JSON array of strings. Example format: ["suggestion 1", "suggestion 2", "suggestion 3"]`,
        },
      ],
      temperature: 0.7,
    });

    let content = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to parse the JSON
    const suggestions = JSON.parse(content);
    
    // Ensure it's an array
    if (Array.isArray(suggestions)) {
      return suggestions;
    } else {
      console.error("AI response is not an array:", suggestions);
      return [];
    }
  } catch (error) {
    console.error("AI Suggestions generation failed:", error);
    // Return fallback suggestions based on type
    return getFallbackSuggestions(suggestionType);
  }
}

// Fallback suggestions when AI fails
function getFallbackSuggestions(suggestionType) {
  const fallbacks = {
    "overview and motivation": [
      "Keep tracking your daily progress consistently!",
      "Stay hydrated and get enough sleep for better results.",
      "Celebrate small wins on your fitness journey."
    ],
    "meal and nutrition": [
      "Focus on balanced meals with protein, carbs, and healthy fats.",
      "Plan your meals ahead to stay on track with your goals.",
      "Include more vegetables and fruits in your daily diet."
    ],
    "workout and exercise": [
      "Start with 30 minutes of exercise, 3 times per week.",
      "Mix cardio and strength training for best results.",
      "Listen to your body and rest when needed."
    ],
    "progress tracking and weight management": [
      "Weigh yourself at the same time each day for consistency.",
      "Track measurements beyond just weight for better insights.",
      "Focus on long-term trends rather than daily fluctuations."
    ]
  };
  
  return fallbacks[suggestionType] || [
    "Stay consistent with your fitness journey!",
    "Small steps lead to big changes.",
    "You're doing great, keep it up!"
  ];
}

// Ask AI Coach
async function askCoach(formData) {
  "use server";
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const message = formData.get("message");
  if (!message) return;

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
      weights: {
        orderBy: { date: "desc" },
        take: 3,
      },
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional fitness and nutrition coach. You have access to the user's profile and recent activity. Provide helpful, personalized advice based on their data and question. Be encouraging, specific, and actionable.`,
        },
        {
          role: "user",
          content: `User Profile:
- Name: ${user.name}
- Gender: ${user.onboarding?.gender || "Not specified"}
- Age: ${user.onboarding?.age || "Not specified"}
- Goal: ${user.onboarding?.goal || "Not specified"}
- Activity Level: ${user.onboarding?.activityLevel || "Not specified"}
- Current Weight: ${user.weights[0]?.weight || user.onboarding?.currentWeight || "Not specified"} kg

Recent Activity:
- Today's Meals: ${JSON.stringify(user.meals)}
- Today's Workouts: ${JSON.stringify(user.workouts)}
- Recent Weights: ${JSON.stringify(user.weights)}

User Question: ${message}`,
        },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    
    // Store the conversation in session or database if needed
    // For now, we'll just redirect back with the response
    redirect(`/dashboard?tab=coach&response=${encodeURIComponent(response)}`);
  } catch (error) {
    console.error("AI Coach failed:", error);
    redirect("/dashboard?tab=coach&error=true");
  }
}

export default async function Dashboard({ searchParams }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Check if user has completed onboarding
  const userCheck = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { onboarding: true, aiPlan: true }
  });

  // If no onboarding data, redirect to AI Plan for onboarding
  if (!userCheck.onboarding) {
    if (params?.tab !== 'plan') {
      redirect('/dashboard?tab=plan&onboarding=true');
    }
  }

  // If onboarding complete but no AI plan, redirect to generate plan
  if (userCheck.onboarding && !userCheck.aiPlan) {
    if (params?.tab !== 'plan') {
      redirect('/dashboard?tab=plan&generate=true');
    }
  }

  const activeTab = params?.tab || (userCheck.onboarding && userCheck.aiPlan ? "plan" : "plan");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      meals: {
        where: {
          date: getToday(),
        },
        orderBy: { createdAt: "desc" },
      },
      workouts: {
        where: {
          date: getToday(),
        },
        orderBy: { createdAt: "desc" },
      },
      weights: {
        orderBy: { date: "desc" },
        take: 10,
      },
      progressPhotos: {
        orderBy: { date: "desc" },
        take: 10,
      },
      onboarding: true,
      aiPlan: true,
    },
  });

  const todayMeals = user.meals || [];
  const todayWorkouts = user.workouts || [];
  const currentWeight = user.weights[0]?.weight || user.onboarding?.currentWeight;

  const totalCalories = todayMeals.reduce(
    (sum, meal) => sum + meal.calories,
    0
  );
  
  let targetCalories = 2000; // default
  if (user.onboarding) {
    targetCalories = calculateCalories(
      user.onboarding.currentWeight,
      user.onboarding.height,
      user.onboarding.age,
      user.onboarding.gender,
      user.onboarding.activityLevel,
      user.onboarding.goal
    );
  }

  const totalWorkouts = todayWorkouts.length;
  const badge = evaluateBadge(totalCalories, targetCalories, totalWorkouts);

  // Parse AI plans - handle both string and JSON formats
  let aiMealPlan = [];
  let aiWorkoutPlan = [];
  if (user.aiPlan) {
    try {
      // Try to parse as JSON first (new format)
      aiMealPlan = JSON.parse(user.aiPlan.mealPlan);
      aiWorkoutPlan = JSON.parse(user.aiPlan.workoutPlan);
    } catch (e) {
      // If JSON parse fails, treat as string format (old format)
      console.log("Using string format for AI plans");
      aiMealPlan = [];
      aiWorkoutPlan = [];
    }
  }

  // Generate AI Suggestions for each tab if user has onboarding data
  let overviewSuggestions = [];
  let mealSuggestions = [];
  let workoutSuggestions = [];
  let progressSuggestions = [];

  if (user.onboarding) {
    try {
      // Overview suggestions based on current progress
      overviewSuggestions = await generateAISuggestions(
        user.onboarding,
        {
          totalCalories,
          targetCalories,
          totalWorkouts,
          currentWeight,
          goal: user.onboarding.goal
        },
        "overview and motivation"
      );

      // Meal suggestions based on current intake
      mealSuggestions = await generateAISuggestions(
        user.onboarding,
        {
          todayCalories: totalCalories,
          targetCalories,
          mealsToday: todayMeals.length,
          goal: user.onboarding.goal
        },
        "meal and nutrition"
      );

      // Workout suggestions based on current activity
      workoutSuggestions = await generateAISuggestions(
        user.onboarding,
        {
          workoutsToday: totalWorkouts,
          activityLevel: user.onboarding.activityLevel,
          goal: user.onboarding.goal
        },
        "workout and exercise"
      );

      // Progress suggestions based on weight history
      progressSuggestions = await generateAISuggestions(
        user.onboarding,
        {
          currentWeight,
          targetWeight: user.onboarding.targetWeight,
          weightHistory: user.weights.slice(0, 5),
          goal: user.onboarding.goal
        },
        "progress tracking and weight management"
      );
    } catch (error) {
      console.error("Failed to generate AI suggestions:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            BodyGoal Dashboard - {user.name}
          </h1>
          <form action={logoutUser}>
            <button 
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              🚪 Logout
            </button>
          </form>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <a
                href="/dashboard?tab=plan"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "plan"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🤖 AI Plan
              </a>
              <a
                href="/dashboard?tab=meals"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "meals"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🍽️ Meals
              </a>
              <a
                href="/dashboard?tab=workouts"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "workouts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                💪 Workouts
              </a>
              <a
                href="/dashboard?tab=overview"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📊 Overview
              </a>
              <a
                href="/dashboard?tab=progress"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "progress"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📈 Progress
              </a>
              <a
                href="/dashboard?tab=coach"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "coach"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🤖 AI Coach
              </a>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Today's Calories
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {totalCalories} / {targetCalories}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((totalCalories / targetCalories) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Workouts Today
                </h3>
                <p className="text-2xl font-bold text-green-600">{totalWorkouts}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Current Weight
                </h3>
                <p className="text-2xl font-bold text-purple-600">{currentWeight} kg</p>
              </div>
            </div>

            {/* Badge */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Today's Achievement
              </h3>
              <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {badge}
              </span>
            </div>

            {/* AI Suggestions for Overview */}
            {overviewSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  🤖 AI Suggestions for You
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Personalized
                  </span>
                </h3>
                <div className="space-y-3">
                  {overviewSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Recent Meals
                </h3>
                {todayMeals.length > 0 ? (
                  <div className="space-y-2">
                    {todayMeals.slice(0, 3).map((meal) => (
                      <div key={meal.id} className="flex justify-between">
                        <span className="text-gray-600">{meal.name}</span>
                        <span className="text-blue-600 font-medium">
                          {meal.calories} cal
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No meals added today</p>
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Recent Workouts
                </h3>
                {todayWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {todayWorkouts.slice(0, 3).map((workout) => (
                      <div key={workout.id} className="flex justify-between">
                        <span className="text-gray-600">{workout.name}</span>
                        <span className="text-green-600 font-medium">
                          {workout.duration} min
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No workouts added today</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "plan" && (
          <div className="space-y-6">
            {/* Onboarding Mode */}
            {params?.onboarding === 'true' && !user.onboarding && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🎯 Welcome! Let's Create Your Personal Plan
                </h2>
                <p className="text-gray-600 mb-6">
                  Tell us about yourself to generate personalized meal and workout plans
                </p>
                
                {/* Onboarding Form */}
                <form action={generateAIPlan} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input name="age" type="number" placeholder="25" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input name="height" type="number" placeholder="170" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight (kg)</label>
                      <input name="currentWeight" type="number" step="0.1" placeholder="70" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Weight (kg)</label>
                      <input name="targetWeight" type="number" step="0.1" placeholder="65" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select name="gender" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                      <select name="activityLevel" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="">Select Activity Level</option>
                        <option value="sedentary">Sedentary (little/no exercise)</option>
                        <option value="light">Light (light exercise 1-3 days/week)</option>
                        <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                        <option value="active">Active (hard exercise 6-7 days/week)</option>
                        <option value="very_active">Very Active (very hard exercise, physical job)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Goal</label>
                      <select name="goal" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="">Select Your Goal</option>
                        <option value="lose_weight">Lose Weight</option>
                        <option value="gain_weight">Gain Weight</option>
                        <option value="maintain_weight">Maintain Weight</option>
                        <option value="build_muscle">Build Muscle</option>
                      </select>
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition shadow-lg">
                    🚀 Create My Personal Plan
                  </button>
                </form>
              </div>
            )}

            {/* Plan Generated Mode */}
            {user.onboarding && (
              <div>
                {/* Success Message for New Plan */}
                {params?.generated === 'true' && (
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-bold text-green-800 mb-2">
                      ✅ Your Personal Plan is Ready!
                    </h3>
                    <p className="text-green-700">
                      Check other tabs to see your daily to-do lists automatically generated based on your goals.
                    </p>
                  </div>
                )}

                {/* AI Plan Generation */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        🤖 AI-Generated Personal Plan
                      </h3>
                      <p className="text-gray-600">
                        Get personalized meal and workout plans based on your goals and data
                      </p>
                    </div>
                    <form action={generateAIPlan}>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition"
                      >
                        Generate New Plan
                      </button>
                    </form>
                  </div>
                  
                  {user.aiPlan && (
                    <p className="text-sm text-gray-500">
                      Last generated: {new Date(user.aiPlan.generatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* AI Meal Plan */}
            {aiMealPlan.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  🍽️ AI Meal Plan
                  <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    {aiMealPlan.reduce((sum, meal) => sum + meal.calories, 0)} cal total
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiMealPlan.map((meal, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{meal.name}</h4>
                        <span className="text-blue-600 font-bold">{meal.calories} cal</span>
                      </div>
                      <p className="text-gray-600 text-sm">{meal.description}</p>
                      <form action={addMeal} className="mt-3">
                        <input type="hidden" name="name" value={meal.name} />
                        <input type="hidden" name="calories" value={meal.calories} />
                        <button
                          type="submit"
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                        >
                          Add to Today
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Workout Plan */}
            {aiWorkoutPlan.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  💪 AI Workout Plan
                  <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {aiWorkoutPlan.reduce((sum, workout) => sum + workout.duration, 0)} min total
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiWorkoutPlan.map((workout, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{workout.name}</h4>
                        <span className="text-purple-600 font-bold">{workout.duration} min</span>
                      </div>
                      <p className="text-gray-600 text-sm">{workout.description}</p>
                      <form action={addWorkout} className="mt-3">
                        <input type="hidden" name="name" value={workout.name} />
                        <input type="hidden" name="duration" value={workout.duration} />
                        <button
                          type="submit"
                          className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition"
                        >
                          Add to Today
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Plan Yet */}
            {aiMealPlan.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No AI Plan Generated Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Click "Generate New Plan" to create your personalized meal and workout plan
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-6">
            {/* AI Suggestions for Progress */}
            {progressSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  📈 AI Progress Insights
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Goal Tracking
                  </span>
                </h3>
                <div className="space-y-3">
                  {progressSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Update Weight
              </h3>
              <form action={addWeight} className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    step="0.1"
                    required
                    className="border border-gray-300 rounded-md px-3 py-2 w-32"
                    placeholder="70.5"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Add Weight
                </button>
              </form>
            </div>

            {/* Progress Photo Upload */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                📸 Progress Photos
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Visual Tracking
                </span>
              </h3>
              <form action={uploadProgressPhoto} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Progress Photo
                  </label>
                  <input 
                    type="file" 
                    name="photo" 
                    accept="image/*" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a photo to track your visual progress over time
                  </p>
                </div>
                <button 
                  type="submit" 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  📤 Upload Photo
                </button>
              </form>
            </div>

            {/* Progress Photo Gallery */}
            {user.progressPhotos && user.progressPhotos.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  📷 Photo History
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {user.progressPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img 
                        src={photo.photoUrl} 
                        alt={`Progress photo from ${photo.date}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-md transition"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA0OEw5MyA1NEw5OSA0OEwxMDUgNTRMMTEzIDQ2VjgySDg3VjQ4WiIgZmlsbD0iIzlDQTNBRiIvPgo8Y2lyY2xlIGN4PSI5NCIgY3k9IjU4IiByPSI0IiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZCNzI4MCI+UGhvdG88L3RleHQ+CjwvZXZnPgo=';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                        {photo.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Weight History
              </h3>
              {user.weights.length > 0 ? (
                <div className="space-y-2">
                  {user.weights.map((weight) => (
                    <div key={weight.id} className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">{weight.date}</span>
                      <span className="text-purple-600 font-medium">
                        {weight.weight} kg
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No weight records yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "meals" && (
          <div className="space-y-6">
            {/* Daily Meal To-Do List */}
            {aiMealPlan.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  📋 Today's Meal Plan
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    AI Generated
                  </span>
                </h3>
                <div className="space-y-3">
                  {aiMealPlan.map((meal, index) => {
                    const mealName = meal.name;
                    const isCompleted = todayMeals.some(m => m.name.toLowerCase().includes(mealName.toLowerCase().split(' ')[0]));
                    
                    return (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg transition ${isCompleted ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}`}>
                        <input 
                          type="checkbox" 
                          checked={isCompleted}
                          readOnly
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${isCompleted ? 'text-green-800 line-through' : 'text-gray-700'}`}>
                            {mealName} - {meal.calories} cal
                          </p>
                          <p className="text-xs text-gray-500">{meal.description}</p>
                        </div>
                        {!isCompleted && (
                          <form action={addMeal} className="inline">
                            <input type="hidden" name="name" value={mealName} />
                            <input type="hidden" name="calories" value={meal.calories} />
                            <button 
                              type="submit"
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full transition"
                            >
                              Quick Add
                            </button>
                          </form>
                        )}
                        {isCompleted && (
                          <span className="text-xs text-green-600 font-medium">✓ Done</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Suggestions for Meals */}
            {mealSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  🍽️ AI Nutrition Suggestions
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Smart Tips
                  </span>
                </h3>
                <div className="space-y-3">
                  {mealSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Add New Meal
              </h3>
              <form action={addMeal} className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="border border-gray-300 rounded-md px-3 py-2 w-48"
                    placeholder="Chicken Salad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    name="calories"
                    required
                    className="border border-gray-300 rounded-md px-3 py-2 w-32"
                    placeholder="350"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Add Meal
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Today's Meals
              </h3>
              {todayMeals.length > 0 ? (
                <div className="space-y-3">
                  {todayMeals.map((meal) => (
                    <div key={meal.id} className="flex justify-between items-center py-3 border-b">
                      <div>
                        <h4 className="font-medium text-gray-900">{meal.name}</h4>
                        <p className="text-sm text-gray-500">
                          Added at {new Date(meal.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-green-600 font-bold">
                        {meal.calories} cal
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 border-t-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Calories:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {totalCalories} / {targetCalories}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No meals added today</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "workouts" && (
          <div className="space-y-6">
            {/* Daily Workout To-Do List */}
            {aiWorkoutPlan.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  🏋️ Today's Workout Plan
                  <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    AI Generated
                  </span>
                </h3>
                <div className="space-y-3">
                  {aiWorkoutPlan.map((workout, index) => {
                    const workoutName = workout.name;
                    const isCompleted = todayWorkouts.some(w => w.name.toLowerCase().includes(workoutName.toLowerCase().split(' ')[0]));
                    
                    return (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg transition ${isCompleted ? 'bg-purple-100 border border-purple-300' : 'bg-white border border-gray-200'}`}>
                        <input 
                          type="checkbox" 
                          checked={isCompleted}
                          readOnly
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${isCompleted ? 'text-purple-800 line-through' : 'text-gray-700'}`}>
                            {workoutName} - {workout.duration} min
                          </p>
                          <p className="text-xs text-gray-500">{workout.description}</p>
                        </div>
                        {!isCompleted && (
                          <form action={addWorkout} className="inline">
                            <input type="hidden" name="name" value={workoutName} />
                            <input type="hidden" name="duration" value={workout.duration} />
                            <button 
                              type="submit"
                              className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-full transition"
                            >
                              Quick Add
                            </button>
                          </form>
                        )}
                        {isCompleted && (
                          <span className="text-xs text-purple-600 font-medium">✓ Done</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Suggestions for Workouts */}
            {workoutSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  💪 AI Workout Suggestions
                  <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Fitness Tips
                  </span>
                </h3>
                <div className="space-y-3">
                  {workoutSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Add New Workout
              </h3>
              <form action={addWorkout} className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="border border-gray-300 rounded-md px-3 py-2 w-48"
                    placeholder="Push-ups"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    required
                    className="border border-gray-300 rounded-md px-3 py-2 w-32"
                    placeholder="30"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
                >
                  Add Workout
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Today's Workouts
              </h3>
              {todayWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {todayWorkouts.map((workout) => (
                    <div key={workout.id} className="flex justify-between items-center py-3 border-b">
                      <div>
                        <h4 className="font-medium text-gray-900">{workout.name}</h4>
                        <p className="text-sm text-gray-500">
                          Added at {new Date(workout.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-purple-600 font-bold">
                        {workout.duration} min
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 border-t-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Workouts:</span>
                      <span className="text-xl font-bold text-purple-600">
                        {totalWorkouts}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No workouts added today</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "coach" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                🤖 AI Personal Coach
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                  24/7 Available
                </span>
              </h3>
              <p className="text-gray-600 mb-4">
                Ask your AI coach anything about fitness, nutrition, motivation, or your progress. 
                I have access to your profile and recent activity to provide personalized advice.
              </p>
            </div>

            {/* Display AI Response */}
            {searchParams?.response && (
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  🤖 Coach Response
                </h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {decodeURIComponent(searchParams.response)}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {searchParams?.error && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700">
                  Sorry, I'm having trouble right now. Please try again later.
                </p>
              </div>
            )}

            {/* Chat Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                💬 Ask Your Coach
              </h4>
              <form action={askCoach} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Example: I'm struggling to stay motivated with my workouts. What should I do?"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition"
                >
                  Ask Coach 🚀
                </button>
              </form>
            </div>

            {/* Quick Questions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                💡 Quick Questions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "How can I improve my meal planning?",
                  "What exercises should I focus on?",
                  "How to stay motivated?",
                  "Am I on track with my goals?",
                  "What should I eat before workout?",
                  "How to track progress better?"
                ].map((question, index) => (
                  <form key={index} action={askCoach} className="inline">
                    <input type="hidden" name="message" value={question} />
                    <button
                      type="submit"
                      className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm text-gray-700 hover:text-blue-700 transition"
                    >
                      {question}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}