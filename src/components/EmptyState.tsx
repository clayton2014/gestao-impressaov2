"use client";
import React from "react";

export default function EmptyState({
  titulo, subtitulo, onCreate, onSeed, onMigrate, onDiagnose
}:{
  titulo:string; subtitulo:string;
  onCreate: ()=>void; onSeed: ()=>Promise<void>;
  onMigrate?: ()=>Promise<void>; onDiagnose?: ()=>Promise<void>;
}){
  return (
    <div className="p-8 rounded-xl border bg-card text-center">
      <h3 className="text-lg font-semibold">{titulo}</h3>
      <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <button className="btn btn-primary px-4 py-2 rounded-md" onClick={onCreate}>Cadastrar agora</button>
        <button className="btn px-4 py-2 rounded-md" onClick={()=>onSeed().catch(()=>{})}>Popular com exemplos</button>
        {onMigrate && <button className="btn px-4 py-2 rounded-md" onClick={()=>onMigrate().catch(()=>{})}>Importar do navegador</button>}
        {onDiagnose && <button className="btn px-4 py-2 rounded-md" onClick={()=>onDiagnose().catch(()=>{})}>Diagnóstico</button>}
      </div>
    </div>
  );
}