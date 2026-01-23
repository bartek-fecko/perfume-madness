function Loading() {
  return (
    <div className="flex">
      <aside className="w-52 shrink-0 bg-sidebar border-r border-sidebar-border p-3 pt-5">
        <div className="h-4 w-20 bg-muted rounded animate-pulse mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 bg-muted rounded-lg animate-pulse mb-1"
          />
        ))}
      </aside>
      <main className="flex-1 p-6">
        <div className="h-10 w-full max-w-md bg-muted rounded animate-pulse mb-4" />
        <div className="h-10 w-64 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Loading;
