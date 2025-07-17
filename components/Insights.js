"use client";

export default function Insights() {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-2">
        💡 AI Insights & Recommendations
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Personalized advice to help you stay on track.
      </p>

      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
        <li>Based on your goal, you need to lose 1.0kg per week</li>
        <li>This requires a daily caloric deficit of 1100 calories</li>
        <li>I recommend 4 workout days per week</li>
        <li>Your journey will take approximately 1 month</li>
        <li>Focus on cardio and toning exercises</li>
        <li>Your BMI will improve from 22.6 to 20.5</li>
      </ul>
    </div>
  );
}
