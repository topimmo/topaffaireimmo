import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PropertyCardSkeletonProps {
  className?: string;
  size?: "default" | "large";
}

export default function PropertyCardSkeleton({
  className,
  size = "default",
}: PropertyCardSkeletonProps) {
  return (
    <div
      className={cn(
        "block bg-white rounded-2xl border border-border/50 overflow-hidden",
        "shadow-lg",
        className
      )}
    >
      {/* Image Container Skeleton */}
      <Skeleton
        className={cn(
          "w-full",
          size === "large" ? "aspect-[4/3]" : "aspect-[16/10]"
        )}
      />

      {/* Content Skeleton */}
      <div className="p-5 md:p-6">
        {/* Title Skeleton */}
        <Skeleton className={cn(
          "w-3/4 mb-3",
          size === "large" ? "h-7" : "h-6"
        )} />

        {/* Location Skeleton */}
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Features Skeleton */}
        <div className="flex items-center gap-5 pt-5 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}
