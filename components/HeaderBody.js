"use client";

import { useState } from "react";
import { FaFireAlt, FaStopwatch } from "react-icons/fa";

export default function Header() {
  const [currentMenu, setCurrentMenu] = useState("Dashboard");

  const menuItems = [
    "Dashboard",
    "Plan",
    "Meal",
    "Progress",
    "Coach",
    "Settings",
  ];

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
      {/* Kiri: Logo */}
      <div className="flex items-center gap-2 font-bold text-lg text-indigo-700">
        <span className="text-indigo-500">🏋️</span> BodyGoal
        <span className="text-sm text-gray-400 ml-1 font-medium">
          AI Fitness Coach
        </span>
      </div>

      {/* Tengah: Menu */}
      <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => setCurrentMenu(item)}
            className={`hover:text-indigo-600 transition ${
              currentMenu === item ? "text-indigo-600 font-semibold" : ""
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Kanan: Status + Avatar */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <FaFireAlt className="text-orange-500" /> Week 1
          </span>
          <span className="flex items-center gap-1">
            <FaStopwatch className="text-gray-500" /> 0 day streak
          </span>
          <button className="border border-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-100">
            Reset Progress
          </button>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
      </div>
    </header>
  );
}
