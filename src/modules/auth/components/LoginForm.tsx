"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/modules/auth/actions/auth.actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">Correo</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="w-full rounded-md border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-md border px-3 py-2" />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
