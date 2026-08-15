export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 shrink-0 bg-card/95 border-b border-border sticky top-0 z-50">
        <div className="h-full px-3 sm:px-6 flex items-center gap-3 sm:gap-5 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0" />
            <div className="h-4 w-28 sm:h-5 sm:w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="w-px h-6 bg-border mx-0.5 hidden sm:block" />
            <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
            <div className="flex items-center gap-2 p-1.5">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="h-3.5 w-16 bg-muted rounded animate-pulse hidden sm:block" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="aspect-square bg-muted rounded-xl animate-pulse" />

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            </div>

            <div className="h-6 w-32 bg-muted rounded animate-pulse" />

            <div className="h-8 w-24 bg-muted rounded animate-pulse" />

            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 w-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-6 w-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
