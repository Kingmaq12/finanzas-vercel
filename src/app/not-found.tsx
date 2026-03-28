import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-sm font-medium text-[var(--app-muted)]">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Página no encontrada</h1>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-[var(--app-accent)] underline"
      >
        Volver al resumen
      </Link>
    </div>
  );
}
