import type { getRbacSettingsData } from "@/modules/auth/repositories/rbac.repository";
import {
  assignUserRoles,
  createUser,
  renameRole,
  setRolePermissions,
} from "@/modules/auth/actions/rbac.actions";

type RbacData = Awaited<ReturnType<typeof getRbacSettingsData>>;

export function RbacSettings({ roles, permissions, users }: RbacData) {
  return (
    <section className="space-y-6 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-bold">Usuarios, roles y permisos</h2>
        <p className="text-sm text-slate-500">Los códigos internos permanecen estables aunque cambie el nombre visible.</p>
      </div>

      <form action={createUser} className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <h3 className="font-semibold md:col-span-3">Nuevo empleado</h3>
        <input name="nombre" required placeholder="Nombre y apellido" className="rounded border px-3 py-2" />
        <input name="email" type="email" required placeholder="Correo" className="rounded border px-3 py-2" />
        <input name="password" type="password" minLength={10} required placeholder="Contraseña inicial" className="rounded border px-3 py-2" />
        <div className="flex flex-wrap gap-3 md:col-span-3">
          {roles.map((role) => <label key={role.id} className="text-sm"><input type="checkbox" name="roleIds" value={role.id} /> {role.nombre}</label>)}
        </div>
        <button className="rounded bg-slate-900 px-4 py-2 text-white md:w-fit">Crear empleado</button>
      </form>

      <div className="grid gap-4 xl:grid-cols-2">
        {roles.map((role) => {
          const assigned = new Set(role.permisos.map(({ permiso }) => permiso.id));
          return (
            <form key={role.id} action={setRolePermissions} className="space-y-3 rounded-lg border p-4">
              <input type="hidden" name="roleId" value={role.id} />
              <div className="flex gap-2">
                <input name="nombre" form={`rename-${role.id}`} defaultValue={role.nombre} className="min-w-0 flex-1 rounded border px-3 py-2" />
                <button form={`rename-${role.id}`} className="rounded border px-3 py-2">Renombrar</button>
              </div>
              <p className="text-xs text-slate-500">Código: {role.codigo}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label key={permission.id} className="text-sm">
                    <input type="checkbox" name="permissionIds" value={permission.id} defaultChecked={assigned.has(permission.id)} /> {permission.descripcion}
                  </label>
                ))}
              </div>
              <button className="rounded bg-blue-600 px-3 py-2 text-white">Guardar permisos</button>
            </form>
          );
        })}
        {roles.map((role) => (
          <form id={`rename-${role.id}`} key={`rename-${role.id}`} action={renameRole}>
            <input type="hidden" name="roleId" value={role.id} />
          </form>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Roles por empleado</h3>
        {users.map((user) => {
          const assigned = new Set(user.roles.map(({ rol }) => rol.id));
          return (
            <form key={user.id} action={assignUserRoles} className="rounded-lg border p-4">
              <input type="hidden" name="userId" value={user.id} />
              <p className="font-medium">{user.nombre} <span className="text-sm text-slate-500">({user.email})</span></p>
              <div className="my-2 flex flex-wrap gap-3">
                {roles.map((role) => <label key={role.id} className="text-sm"><input type="checkbox" name="roleIds" value={role.id} defaultChecked={assigned.has(role.id)} /> {role.nombre}</label>)}
              </div>
              <button className="rounded border px-3 py-1.5">Guardar roles</button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
