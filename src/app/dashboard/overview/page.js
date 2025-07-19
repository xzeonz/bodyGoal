import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getToday } from "@/lib/getToday";
import { evaluateBadge } from "@/lib/evaluateBadge";
import { generateAISuggestions } from "../../action.js";

// Helper function ini mungkin sudah ada di lib Anda, jika tidak, definisikan di sini atau di lib
function calculateCalories(weight, height, age, gender, activityLevel, goal) {
  let bmr;
  if (gender === "male") bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  else bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = bmr * (multipliers[activityLevel] || 1.2);
  if (goal?.toLowerCase().includes("lose")) return Math.round(tdee - 500);
  if (goal?.toLowerCase().includes("gain")) return Math.round(tdee + 300);
  return Math.round(tdee);
}

export default async function OverviewPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      meals: { where: { date: getToday() }, orderBy: { createdAt: "desc" } },
      workouts: { where: { date: getToday() }, orderBy: { createdAt: "desc" } },
      weights: { orderBy: { date: "desc" }, take: 1 },
      onboarding: true,
    },
  });

  if (!user) redirect("/login");

  const todayMeals = user.meals || [];
  const todayWorkouts = user.workouts || [];
  const currentWeight =
    user.weights[0]?.weight || user.onboarding?.currentWeight;
  const totalCalories = todayMeals.reduce(
    (sum, meal) => sum + meal.calories,
    0
  );
  const totalWorkouts = todayWorkouts.length;

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

  const badge = evaluateBadge(totalCalories, targetCalories, totalWorkouts);

  const overviewSuggestions = user.onboarding
    ? await generateAISuggestions(
        user.onboarding,
        {
          totalCalories,
          targetCalories,
          totalWorkouts,
          currentWeight,
          goal: user.onboarding.goal,
        },
        "overview and motivation"
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Kalori Hari Ini
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {totalCalories} / {targetCalories}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  (totalCalories / targetCalories) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Olahraga Hari Ini
          </h3>
          <p className="text-2xl font-bold text-green-600">{totalWorkouts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Berat Terkini
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {currentWeight} kg
          </p>
        </div>
      </div>

      {/* Badge */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Pencapaian Hari Ini
        </h3>
        <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          {badge}
        </span>
      </div>

      {/* AI Suggestions */}
      {overviewSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            🤖 Saran AI Untuk Anda
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Personal
            </span>
          </h3>
          <div className="space-y-3">
            {overviewSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Makanan Terakhir
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
            <p className="text-gray-500">Belum ada makanan ditambahkan</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Olahraga Terakhir
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
            <p className="text-gray-500">Belum ada olahraga ditambahkan</p>
          )}
        </div>
      </div>
    </div>
  );
}
