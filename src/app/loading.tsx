import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="h-5 w-32 rounded bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
