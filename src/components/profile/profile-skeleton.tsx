export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse" data-testid="profile-skeleton">
      {/* Identity card skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>

      {/* Stats card skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="h-5 bg-gray-200 rounded w-24 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-20" />
          ))}
        </div>
      </div>

      {/* Report list skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-md p-4">
              <div className="flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
