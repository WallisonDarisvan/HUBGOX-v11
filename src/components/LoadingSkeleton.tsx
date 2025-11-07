import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Profile Card Skeleton */}
        <div className="glass-card border-border mb-6 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Buttons Skeleton */}
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
                <Skeleton className="w-20 h-20 rounded ml-4" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AuthSkeleton = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card border-border p-8 w-full max-w-md">
        <Skeleton className="h-8 w-48 mx-auto mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
};
