import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Selalu arahkan ke halaman 'plan' sebagai default
  // Logika redirect yang lebih kompleks sudah ditangani di layout.js
  redirect("/dashboard/plan");
}
