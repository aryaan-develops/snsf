import { SkeletonTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="h-8 w-48 rounded-xl bg-slate-800 animate-pulse" />
      <SkeletonTable rows={4} cols={6} />
      <SkeletonTable rows={3} cols={6} />
    </div>
  );
}
