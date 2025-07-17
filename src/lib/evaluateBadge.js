export function evaluateBadge(todayWeight, prevWeight) {
  if (todayWeight < prevWeight) return "🔥 Progress!";
  else if (todayWeight === prevWeight) return "📊 Stabil, jaga konsistensi!";
  else return "⚠️ Berat naik, evaluasi meal & workout.";
}
