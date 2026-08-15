function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 shrink-0 bg-card border-b border-border sticky top-0 z-50" />
      <div className="flex w-full max-w-[1600px] mx-auto">
        <aside className="hidden md:block w-56 shrink-0 p-2 pt-3 sticky top-[4.0625rem] self-start h-[calc(100vh-4.0625rem)]">
            <div className="flex flex-col h-full bg-card border border-border/70 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-3">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 bg-muted rounded-lg animate-pulse mb-1.5"
                />
              ))}
            </div>
          </aside>
          <main className="flex-1 min-w-0 px-3 pb-4 sm:px-4 sm:pb-5 pt-3 sm:pt-4">
            <div className="h-9 w-full bg-card border border-border/70 rounded-lg animate-pulse mb-3" />
            <div className="h-20 w-full bg-card border border-border/70 rounded-lg animate-pulse mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          </main>
      </div>
    </div>
  );
}

export default Loading;
