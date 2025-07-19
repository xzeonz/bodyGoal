import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getToday } from "@/lib/getToday";
import { generateAISuggestions, addWorkout } from "../../action.js";

export default async function WorkoutsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      workouts: {
        where: { date: getToday() },
        orderBy: { createdAt: "desc" },
      },
      onboarding: true,
      aiPlan: true,
    },
  });

  if (!user) redirect("/login");

  const todayWorkouts = user.workouts || [];
  const totalWorkouts = todayWorkouts.length;

  let aiWorkoutPlan = [];
  if (user.aiPlan?.workoutPlan) {
    try {
      aiWorkoutPlan = JSON.parse(user.aiPlan.workoutPlan);
    } catch (e) {
      console.error("Failed to parse AI workout plan:", e);
      aiWorkoutPlan = [];
    }
  }

  const workoutSuggestions = user.onboarding
    ? await generateAISuggestions(
        user.onboarding,
        {
          workoutsToday: totalWorkouts,
          activityLevel: user.onboarding.activityLevel,
          goal: user.onboarding.goal,
        },
        "workout and exercise"
      )
    : [];

  return (
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
              const isCompleted = todayWorkouts.some((w) =>
                w.name
                  .toLowerCase()
                  .includes(workoutName.toLowerCase().split(" ")[0])
              );

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition ${
                    isCompleted
                      ? "bg-purple-100 border border-purple-300"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    readOnly
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        isCompleted
                          ? "text-purple-800 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {workoutName} - {workout.duration} min
                    </p>
                    <p className="text-xs text-gray-500">
                      {workout.description}
                    </p>
                  </div>
                  {!isCompleted && (
                    <form action={addWorkout} className="inline">
                      <input type="hidden" name="name" value={workoutName} />
                      <input
                        type="hidden"
                        name="duration"
                        value={workout.duration}
                      />
                      <button
                        type="submit"
                        className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-full transition"
                      >
                        Quick Add
                      </button>
                    </form>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-purple-600 font-medium">
                      ✓ Done
                    </span>
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
                <p className="text-gray-700 text-sm leading-relaxed">
                  {suggestion}
                </p>
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
              <div
                key={workout.id}
                className="flex justify-between items-center py-3 border-b"
              >
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
  );
}
