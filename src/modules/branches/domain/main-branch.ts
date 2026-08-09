export interface MainBranchCandidate {
  id: number;
  activa: boolean;
  esPrincipal: boolean;
}

export function assertSingleMainBranch<T extends MainBranchCandidate>(branches: T[]): T {
  const matches = branches.filter((branch) => branch.activa && branch.esPrincipal);
  if (matches.length !== 1) {
    throw new Error(`Se requiere exactamente un local principal activo; se encontraron ${matches.length}.`);
  }
  return matches[0];
}
