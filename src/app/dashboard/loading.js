const SkeletonCard = ({ className }) => (
  <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
);

export default function MealsLoading() {
  return (
    <div className="space-y-6">
      {/* Skeleton untuk AI Photo Analyzer */}
      <SkeletonCard className="h-48 w-full" />

      {/* Skeleton untuk Daily Meal Plan */}
      <SkeletonCard className="h-64 w-full" />

      {/* Skeleton untuk AI Suggestions */}
      <SkeletonCard className="h-40 w-full" />

      {/* Skeleton untuk Form Add Meal */}
      <SkeletonCard className="h-32 w-full" />

      {/* Skeleton untuk Today's Meals list */}
      <SkeletonCard className="h-56 w-full" />
    </div>
  );
}
