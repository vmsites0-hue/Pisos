"use server";

import { redirect } from "next/navigation";
import { authenticate, closeCurrentSession } from "@/modules/auth/services/session.service";

export type LoginState = { error: string | null };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Ingresá tu correo y contraseña." };

  const user = await authenticate(email, password);
  if (!user) return { error: "Credenciales inválidas o usuario inactivo." };

  redirect("/");
}

export async function logoutAction() {
  await closeCurrentSession();
  redirect("/login");
}
