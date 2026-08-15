"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pl">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "3rem" }}>🫙</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Coś poszło nie tak
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#555", maxWidth: "20rem" }}>
            Wystąpił błąd podczas ładowania aplikacji. Odśwież stronę lub
            otwórz ją w zaktualizowanej przeglądarce (Chrome, Safari,
            Edge).
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: "0.5rem",
              backgroundColor: "#2e7d5b",
              color: "#fff",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Spróbuj ponownie
          </button>
        </div>
      </body>
    </html>
  );
}
