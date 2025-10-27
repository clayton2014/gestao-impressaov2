"use client";
import React from "react";

export default function GlobalError({ error, reset }: { error: any; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-xl border bg-card p-6 shadow">
            <h1 className="text-lg font-semibold mb-2">Ops! Algo deu errado</h1>
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-60 overflow-auto">
              {String(error?.message ?? error ?? "Erro desconhecido")}
            </pre>
            <div className="mt-4 flex gap-2">
              <button onClick={reset} className="btn btn-primary px-4 py-2 rounded-md">Tentar novamente</button>
              <button onClick={()=>location.reload()} className="btn px-4 py-2 rounded-md">Recarregar</button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}