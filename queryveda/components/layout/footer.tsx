export function Footer() {
  return (
    <footer className="border-t py-6">
      <p className="text-center text-sm text-muted-foreground">
        QueryVeda · Built with{" "}
        <a
          href="https://pglite.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          PGlite
        </a>{" "}
        · PostgreSQL in the browser
      </p>
    </footer>
  );
}
