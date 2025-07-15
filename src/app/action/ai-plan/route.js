"use server";

export async function generatePlan(formData) {
  const beratAwal = Number(formData.get("beratAwal"));
  const beratTarget = Number(formData.get("beratTarget"));
  const durasiMinggu = Number(formData.get("durasiMinggu"));
  const goal = formData.get("goal");

  if (
    !beratAwal ||
    !beratTarget ||
    !durasiMinggu ||
    !goal ||
    isNaN(beratAwal) ||
    isNaN(beratTarget) ||
    isNaN(durasiMinggu)
  ) {
    throw new Error("Field tidak lengkap atau tidak valid");
  }

  const defisitKalori =
    goal === "cutting" ? 0.8 : goal === "bulking" ? 1.15 : 1;
  const bmr = beratAwal * 24;
  const dailyCalories = Math.round(bmr * defisitKalori);

  const workoutStyle =
    goal === "cutting"
      ? "HIIT"
      : goal === "bulking"
      ? "Strength Training"
      : "Balanced";

  const mealType =
    goal === "cutting"
      ? "High protein, low carb"
      : goal === "bulking"
      ? "High carb, calorie dense"
      : "Balanced meal";

  return {
    dailyCalories,
    workoutStyle,
    mealType,
  };
}
