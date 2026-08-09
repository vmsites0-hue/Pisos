export function validateCustomerIdentity(input: { type: string; name: string; lastName: string; legalName: string; document: string; taxId: string | null }) {
  if (!input.document.trim()) throw new Error("El documento es obligatorio.");
  if (input.type === "EMPRESA") {
    if (!input.legalName.trim()) throw new Error("La razón social es obligatoria para empresas.");
    if (!input.taxId?.trim()) throw new Error("El RUC es obligatorio para empresas.");
  } else if (!input.name.trim() || !input.lastName.trim()) throw new Error("Nombre y apellido son obligatorios para personas.");
}

export function customerSearchText(input: { name: string; lastName: string; legalName?: string | null; document: string; taxId?: string | null; phone?: string | null }) {
  return [input.name, input.lastName, input.legalName, input.document, input.taxId, input.phone].filter(Boolean).join(" ").toLocaleLowerCase("es");
}
