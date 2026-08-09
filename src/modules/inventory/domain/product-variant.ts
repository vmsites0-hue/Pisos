type AttributeDefinition = {
  id: number;
  tipo: string;
  obligatorio: boolean;
  opciones: string | null;
};

export function validateVariantValues(definitions: AttributeDefinition[], values: Map<number, string>) {
  const errors: string[] = [];
  for (const definition of definitions) {
    const value = values.get(definition.id)?.trim() ?? "";
    if (definition.obligatorio && !value) errors.push(`El atributo ${definition.id} es obligatorio.`);
    if (!value) continue;
    if (definition.tipo === "NUMERO" && !Number.isFinite(Number(value))) errors.push(`El atributo ${definition.id} debe ser numérico.`);
    if (definition.tipo === "BOOLEANO" && !["true", "false"].includes(value)) errors.push(`El atributo ${definition.id} debe ser booleano.`);
    if (definition.tipo === "SELECCION") {
      const options: string[] = definition.opciones ? JSON.parse(definition.opciones) : [];
      if (!options.includes(value)) errors.push(`El atributo ${definition.id} no admite el valor indicado.`);
    }
  }
  return errors;
}

export function readVariantValues(formData: FormData) {
  const values = new Map<number, string>();
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("atributo_")) continue;
    const id = Number(key.slice("atributo_".length));
    if (Number.isInteger(id) && id > 0 && typeof raw === "string" && raw.trim()) values.set(id, raw.trim());
  }
  return values;
}
