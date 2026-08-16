export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 shrink-0 bg-card/95 border-b border-border sticky top-0 z-50">
        <div className="h-full px-3 sm:px-6 flex items-center gap-3 sm:gap-5 w-full max-w-[1600px] mx-auto">
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-10">
          <div className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />

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
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="h-6 sm:h-7 w-44 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {Array.from({ length: 3 }).map((_, col) => (
              <div
                key={col}
                className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-3.5 h-3.5 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex flex-wrap justify-center items-end gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center text-center gap-1.5"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-md animate-pulse" />
                      <div className="h-3.5 w-16 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
