export function getToday() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}
