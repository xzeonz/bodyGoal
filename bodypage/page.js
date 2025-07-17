import Header from "app/components/HeaderBody";
import DashboardCard from "app/components/DashboardCard";
import GoalPlan from "app/components/GoalPlan";
import Insights from "app/components/Insights";

export default function DashboardPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white px-6 py-8">
        <h1 className="text-2xl font-semibold mb-1">Good afternoon! 👋</h1>
        <p className="text-gray-500 mb-6">
          Here's your personalized AI fitness overview.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Workout"
            value="Pending"
            sub="Time to hit the gym!"
            color="blue"
          />
          <DashboardCard
            title="Calories Consumed"
            value="0 kcal"
            sub="Target: 713 kcal"
            color="green"
          />
          <DashboardCard
            title="Calories Burned"
            value="0 kcal"
            sub="From workouts today"
            color="purple"
          />
          <DashboardCard
            title="Current Weight"
            value="55 kg"
            sub="Target: 50 kg"
            color="orange"
          />
        </div>

        <GoalPlan
          start="55kg"
          current="55kg"
          target="50kg"
          daysLeft="35"
          completePercent="0.0%"
          goalText="I want to lose 5 kg in 1 month"
        />

        <Insights />
      </div>
    </>
  );
}
