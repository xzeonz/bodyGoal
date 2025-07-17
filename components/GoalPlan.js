"use client";

export default function GoalPlan({
  start,
  current,
  target,
  daysLeft,
  completePercent,
  goalText,
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow mb-8">
      <h3 className="font-semibold text-indigo-700 mb-2">
        🎯 Your AI Goal Plan
      </h3>
      <p className="text-sm italic text-gray-700 mb-4">"{goalText}"</p>

      <div className="bg-gray-200 h-2 rounded-full mb-2">
        <div
          className="bg-indigo-500 h-2 rounded-full"
          style={{ width: completePercent }}
        ></div>
      </div>

      <div className="flex justify-between text-sm text-gray-600 font-medium">
        <span>{start} Start</span>
        <span>{current} Current</span>
        <span>{target} Target</span>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {daysLeft} days left to reach your goal!
      </p>
    </div>
  );
}
