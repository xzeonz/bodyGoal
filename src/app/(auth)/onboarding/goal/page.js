import { saveFitnessGoal } from "../../../action";
import BackButton from "../../../../components/BackButton";

export default function GoalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 w-full max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center mb-2">
            <span className="text-purple-600 mr-2">🧠</span> Create Your AI
            Fitness Plan
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Step 2 of 2 - Let's build your personalized roadmap
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>

        <form action={saveFitnessGoal} className="space-y-6">
          <div>
            <label
              htmlFor="goal"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Fitness Goal
            </label>
            <textarea
              id="goal"
              name="goal"
              rows="4"
              maxLength="200"
              placeholder="e.g., I want to lose 15kg in 6 months and build muscle tone"
              className="w-full p-3 border border-gray-300 rounded-md"
              required
            ></textarea>
            <p className="text-sm text-gray-500 mt-1">
              Be specific about timeline and targets
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
            <p className="mb-2">🚀 AI will create your plan based on:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your specific weight/fitness targets</li>
              <li>Timeline you mentioned</li>
              <li>Your current stats and activity level</li>
              <li>Weekly progress tracking & adjustments</li>
            </ul>
          </div>

          <div className="flex justify-between mt-6">
            <BackButton />
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-black text-white hover:bg-gray-900"
            >
              🚀 Create My AI Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
