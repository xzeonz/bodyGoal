import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { generateAIPlan, addMeal, addWorkout } from "../../action.js";

export default async function PlanPage({ searchParams }) {
  const params = await searchParams;

  const session = await getSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      onboarding: true,
      aiPlan: true,
    },
  });

  if (!user) redirect("/login");
  
  if (!user.onboarding && params.onboarding !== "true") {
    redirect("/dashboard/plan?onboarding=true");
  }
  if (user.onboarding && !user.aiPlan && params.generate !== "true") {
    redirect("/dashboard/plan?generate=true");
  }

  let aiMealPlan = [];
  let aiWorkoutPlan = [];
  if (user.aiPlan?.mealPlan && user.aiPlan?.workoutPlan) {
    try {
      aiMealPlan = JSON.parse(user.aiPlan.mealPlan);
      aiWorkoutPlan = JSON.parse(user.aiPlan.workoutPlan);
    } catch (e) {
      console.error("Failed to parse AI plan:", e);
    }
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Mode */}
      {params?.onboarding === "true" && !user.onboarding && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 Selamat Datang! Mari Buat Rencana Pribadi Anda
          </h2>
          <p className="text-gray-600 mb-6">
            Lengkapi data diri untuk membuat rencana makan dan olahraga yang
            dipersonalisasi.
          </p>

          <form action={generateAIPlan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usia
                </label>
                <input
                  name="age"
                  type="number"
                  placeholder="25"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tinggi (cm)
                </label>
                <input
                  name="height"
                  type="number"
                  placeholder="170"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berat Saat Ini (kg)
                </label>
                <input
                  name="currentWeight"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Berat (kg)
                </label>
                <input
                  name="targetWeight"
                  type="number"
                  step="0.1"
                  placeholder="65"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Gender</option>
                  <option value="male">Pria</option>
                  <option value="female">Wanita</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level Aktivitas
                </label>
                <select
                  name="activityLevel"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Level Aktivitas</option>
                  <option value="sedentary">Jarang (tanpa olahraga)</option>
                  <option value="light">Ringan (1-3 hari/minggu)</option>
                  <option value="moderate">Sedang (3-5 hari/minggu)</option>
                  <option value="active">Aktif (6-7 hari/minggu)</option>
                  <option value="very_active">
                    Sangat Aktif (latihan berat/pekerjaan fisik)
                  </option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tujuan Anda
                </label>
                <select
                  name="goal"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Tujuan Anda</option>
                  <option value="lose_weight">Menurunkan Berat Badan</option>
                  <option value="gain_weight">Menaikkan Berat Badan</option>
                  <option value="maintain_weight">Menjaga Berat Badan</option>
                  <option value="build_muscle">Membentuk Otot</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition shadow-lg"
            >
              🚀 Buat Rencana Pribadi Saya
            </button>
          </form>
        </div>
      )}

      {/* Plan Generated Mode */}
      {user.onboarding && (
        <div>
          {params?.generated === "true" && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-green-800 mb-2">
                ✅ Rencana Pribadi Anda Siap!
              </h3>
              <p className="text-green-700">
                Lihat tab lain untuk daftar tugas harian Anda yang dibuat secara
                otomatis.
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🤖 Rencana Pribadi Buatan AI
                </h3>
                <p className="text-gray-600">
                  Dapatkan rencana makan dan olahraga berdasarkan data dan
                  tujuan Anda.
                </p>
              </div>
              <form action={generateAIPlan}>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition"
                >
                  Buat Rencana Baru
                </button>
              </form>
            </div>
            {user.aiPlan && (
              <p className="text-sm text-gray-500">
                Terakhir dibuat:{" "}
                {new Date(user.aiPlan.generatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Meal Plan */}
      {aiMealPlan.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            🍽️ Rencana Makan AI
            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              {aiMealPlan.reduce((sum, meal) => sum + meal.calories, 0)} kal
              total
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiMealPlan.map((meal, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{meal.name}</h4>
                  <span className="text-blue-600 font-bold">
                    {meal.calories} cal
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{meal.description}</p>
                <form action={addMeal} className="mt-3">
                  <input type="hidden" name="name" value={meal.name} />
                  <input type="hidden" name="calories" value={meal.calories} />
                  <button
                    type="submit"
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                  >
                    Tambah ke Hari Ini
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Workout Plan */}
      {aiWorkoutPlan.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            💪 Rencana Olahraga AI
            <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {aiWorkoutPlan.reduce(
                (sum, workout) => sum + workout.duration,
                0
              )}{" "}
              min total
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiWorkoutPlan.map((workout, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {workout.name}
                  </h4>
                  <span className="text-purple-600 font-bold">
                    {workout.duration} min
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{workout.description}</p>
                <form action={addWorkout} className="mt-3">
                  <input type="hidden" name="name" value={workout.name} />
                  <input
                    type="hidden"
                    name="duration"
                    value={workout.duration}
                  />
                  <button
                    type="submit"
                    className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition"
                  >
                    Tambah ke Hari Ini
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Plan Yet */}
      {aiMealPlan.length === 0 &&
        aiWorkoutPlan.length === 0 &&
        user.onboarding && (
          <div className="bg-white p-8 rounded-lg shadow text-center mt-6">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Belum Ada Rencana AI
            </h3>
            <p className="text-gray-500 mb-4">
              Klik "Buat Rencana Baru" untuk membuat rencana makan dan olahraga
              pribadi Anda.
            </p>
          </div>
        )}
    </div>
  );
}
