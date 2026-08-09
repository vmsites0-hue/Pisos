"use client";
import { useEffect, useState } from "react";

export function PwaRegistration() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return online ? null : <div role="status" className="fixed inset-x-0 top-0 z-[100] bg-amber-500 p-2 text-center text-xs font-bold text-slate-950">Sin conexión: podés consultar esta pantalla, pero las operaciones comerciales están deshabilitadas.</div>;
}
