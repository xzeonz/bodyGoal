import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getToday } from "@/lib/getToday";
import { calculateCalories } from "@/lib/calculateCalories";
import { generateAISuggestions, addMeal } from "../../action.js";

export default async function MealsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      meals: {
        where: { date: getToday() },
        orderBy: { createdAt: "desc" },
      },
      onboarding: true,
      aiPlan: true,
    },
  });

  if (!user) redirect("/login");

  const todayMeals = user.meals || [];
  
  let targetCalories = 2000;
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

  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);

  let aiMealPlan = [];
  if (user.aiPlan?.mealPlan) {
    try {
      aiMealPlan = JSON.parse(user.aiPlan.mealPlan);
    } catch (e) {
      console.error("Failed to parse AI meal plan:", e);
      aiMealPlan = [];
    }
  }
  
  const mealSuggestions = user.onboarding
    ? await generateAISuggestions(
        user.onboarding,
        {
          todayCalories: totalCalories,
          targetCalories,
          mealsToday: todayMeals.length,
          goal: user.onboarding.goal
        },
        "meal and nutrition"
      )
    : [];

  return (
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
  );
}