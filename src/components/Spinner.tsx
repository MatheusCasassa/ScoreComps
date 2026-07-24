export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-app-muted">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-app-border border-t-brand-400"
        role="status"
        aria-label="Carregando"
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
