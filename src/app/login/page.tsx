import { redirect } from "next/navigation";
import { LoginForm } from "@/modules/auth/components/LoginForm";
import { getAuthenticatedUser } from "@/modules/auth/services/session.service";

export default async function LoginPage() {
  if (await getAuthenticatedUser()) redirect("/");

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">Ingresar a Distri Pisos</h1>
      <p className="mb-6 mt-2 text-sm text-slate-500">Usá tu cuenta individual de empleado.</p>
      <LoginForm />
    </div>
  );
}
