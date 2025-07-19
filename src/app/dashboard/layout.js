import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logoutUser } from "../action";
import DashboardNav from "./components/DashboardNav"; // Kita akan buat komponen Nav terpisah

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      onboarding: true,
      aiPlan: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.onboarding) {
    redirect("/dashboard/plan?onboarding=true");
  } else if (!user.aiPlan) {
    redirect("/dashboard/plan?generate=true");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            BodyGoal Dashboard - {user.name}
          </h1>
          <form action={logoutUser}>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              🚪 Logout
            </button>
          </form>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <DashboardNav />
        </div>

        {/* Tab Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
