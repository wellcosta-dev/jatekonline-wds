export default function TermekekLoading() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8 animate-pulse">
      <div className="h-6 w-40 rounded bg-gray-200 mb-5" />
      <div className="h-10 w-full max-w-xs rounded-xl bg-gray-200 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-100 bg-white p-3 space-y-3">
            <div className="aspect-square rounded-xl bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
            <div className="h-4 w-2/5 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
