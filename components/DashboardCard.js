"use client";

const colors = {
  blue: "from-blue-100 to-blue-50",
  green: "from-green-100 to-green-50",
  purple: "from-purple-100 to-purple-50",
  orange: "from-orange-100 to-orange-50",
};

export default function DashboardCard({ title, value, sub, color = "blue" }) {
  return (
    <div className={`p-4 rounded-xl shadow bg-gradient-to-br ${colors[color]}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-1">{title}</h4>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
