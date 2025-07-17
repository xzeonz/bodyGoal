import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToday } from "@/lib/getToday";
import { calculateCalories } from "@/lib/calculateCalories";
import { evaluateBadge } from "@/lib/evaluateBadge";
import { openai } from "@/utils/openai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      onboarding: true,
    },
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
    
    // Save AI plan to database
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
        generatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("AI Plan generation failed:", error);
  }
}

export default async function Dashboard({ searchParams }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const activeTab = searchParams?.tab || "overview";

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

  // Parse AI plans
  let aiMealPlan = [];
  let aiWorkoutPlan = [];
  if (user.aiPlan) {
    try {
      aiMealPlan = JSON.parse(user.aiPlan.mealPlan);
      aiWorkoutPlan = JSON.parse(user.aiPlan.workoutPlan);
    } catch (e) {
      console.error("Failed to parse AI plans:", e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          BodyGoal Dashboard - {user.name}
        </h1>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <a
                href="/dashboard?tab=overview"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </a>
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
                href="/dashboard?tab=progress"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "progress"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Progress
              </a>
              <a
                href="/dashboard?tab=meals"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "meals"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Meals
              </a>
              <a
                href="/dashboard?tab=workouts"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "workouts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Workouts
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
      </div>
    </div>
  );
}