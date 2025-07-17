export function calculateCalories(bmr, activityLevel, goal) {
  let multiplier = 1;
  if (goal === "cutting") multiplier = 0.8;
  else if (goal === "bulking") multiplier = 1.2;
  return Math.round(bmr * activityLevel * multiplier);
}
