"use client";
export default function Loading({ label="Carregando..." }: { label?: string }) {
  return (
    <div className="p-6 text-sm text-muted-foreground animate-pulse">{label}</div>
  );
}