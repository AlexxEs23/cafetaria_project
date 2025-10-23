export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-32 h-32 bg-gray-200 flex-shrink-0" />
        <div className="p-4 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="h-9 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  )
}
