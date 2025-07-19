import { saveOnboardingData } from "@/app/action";
import BackButton from "@/components/BackButton";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 w-full max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center mb-2">
            <span className="text-blue-600 mr-2">⚡</span> Create Your AI
            Fitness Plan
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Step 1 of 2 - Let's build your personalized roadmap
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: "50%" }}
            />
          </div>
        </div>

        {/* Form */}
        <form action={saveOnboardingData} className="space-y-6">
          {/* Gender & Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                placeholder="25"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="height"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                placeholder="170"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="currentWeight"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Weight (kg)
              </label>
              <input
                type="number"
                id="currentWeight"
                name="currentWeight"
                placeholder="70"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label
              htmlFor="activityLevel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Activity Level
            </label>
            <select
              id="activityLevel"
              name="activityLevel"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">How active are you?</option>
              <option value="sedentary">
                Sedentary (little or no exercise)
              </option>
              <option value="lightly-active">
                Lightly active (1–3 days/week)
              </option>
              <option value="moderately-active">
                Moderately active (3–5 days/week)
              </option>
              <option value="very-active">Very active (6–7 days/week)</option>
              <option value="extra-active">
                Extra active (hard training/job)
              </option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-8">
            <BackButton href="/register" />
            <button
              type="submit"
              className="px-8 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
