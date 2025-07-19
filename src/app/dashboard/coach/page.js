import { askCoach } from "../../action.js";

export default async function CoachPage({ searchParams }) { 
  const params = await searchParams;

  return (
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
      {params?.response && (
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            🤖 Coach Response
          </h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {decodeURIComponent(params.response)}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {params?.error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-700">
            Sorry, I'm having trouble right now. Error:{" "}
            {decodeURIComponent(params.error)}
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
  );
}
