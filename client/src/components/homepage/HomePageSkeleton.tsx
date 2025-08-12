import { Skeleton } from "@/components/ui-kit/Skeleton"

export function HomePageSkeleton() {
  return (
    <div className="flex-col w-1/2 p-5 space-y-3">
        <Skeleton className="bg-gray-200/80 dark:bg-card h-8 w-full" />
        <Skeleton className="bg-gray-200/80 dark:bg-card h-8 w-full" />
    </div>
  );
}