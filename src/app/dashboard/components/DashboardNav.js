"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard/plan", label: "🤖 AI Plan" },
  { href: "/dashboard/meals", label: "🍽️ Meals" },
  { href: "/dashboard/workouts", label: "💪 Workouts" },
  { href: "/dashboard/overview", label: "📊 Overview" },
  { href: "/dashboard/progress", label: "📈 Progress" },
  { href: "/dashboard/coach", label: "🤖 AI Coach" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              pathname === item.href
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
