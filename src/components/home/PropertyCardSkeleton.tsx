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
        "block bg-white rounded-xl border border-muted overflow-hidden",
        "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)]",
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
      <div className="p-4 md:p-5">
        {/* Title Skeleton */}
        <Skeleton className={cn(
          "w-3/4 mb-3",
          size === "large" ? "h-6" : "h-5"
        )} />

        {/* Location Skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Features Skeleton */}
        <div className="flex items-center gap-4 pt-4 border-t border-muted">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
