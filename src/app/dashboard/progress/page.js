import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { addWeight, generateAISuggestions } from "../../action.js";

export default async function ProgressPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      weights: { orderBy: { date: "desc" }, take: 10 },
      onboarding: true,
    },
  });

  if (!user) redirect("/login");

  const progressSuggestions = user.onboarding
    ? await generateAISuggestions(
        user.onboarding,
        {
          currentWeight: user.weights[0]?.weight,
          targetWeight: user.onboarding.targetWeight,
          weightHistory: user.weights.slice(0, 5),
          goal: user.onboarding.goal,
        },
        "progress tracking and weight management"
      )
    : [];

  return (
    <div className="space-y-6">
      {/* AI Suggestions */}
      {progressSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            📈 Wawasan Progres dari AI
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Pelacakan Target
            </span>
          </h3>
          <div className="space-y-3">
            {progressSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
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

      {/* Update Weight Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Perbarui Berat Badan
        </h3>
        <form action={addWeight} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Berat (kg)
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
            Tambah Berat
          </button>
        </form>
      </div>

      {/* Weight History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Riwayat Berat Badan
        </h3>
        {user.weights.length > 0 ? (
          <div className="space-y-2">
            {user.weights.map((weight) => (
              <div
                key={weight.id}
                className="flex justify-between py-2 border-b"
              >
                <span className="text-gray-600">
                  {new Date(weight.date).toLocaleDateString()}
                </span>
                <span className="text-purple-600 font-medium">
                  {weight.weight} kg
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Belum ada catatan berat badan.</p>
        )}
      </div>
    </div>
  );
}
