"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl mb-2">🫙</div>
      <h1 className="text-xl font-semibold text-foreground">
        Coś poszło nie tak
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Wystąpił błąd podczas ładowania strony. Odśwież ją albo zaktualizuj
        przeglądarkę do najnowszej wersji.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
