import { describe, expect, it } from "vitest";
import { customerSearchText, validateCustomerIdentity } from "./customer";
describe("customer identity", () => {
  it("supports people and companies", () => { expect(() => validateCustomerIdentity({ type: "PERSONA", name: "Ana", lastName: "Pérez", legalName: "", document: "1", taxId: null })).not.toThrow(); expect(() => validateCustomerIdentity({ type: "EMPRESA", name: "", lastName: "", legalName: "Pisos SA", document: "2", taxId: "2-1" })).not.toThrow(); });
  it("requires legal identity for companies", () => expect(() => validateCustomerIdentity({ type: "EMPRESA", name: "", lastName: "", legalName: "", document: "2", taxId: null })).toThrow("razón social"));
  it("indexes phone, document, RUC and names", () => expect(customerSearchText({ name: "", lastName: "", legalName: "Pisos SA", document: "123", taxId: "123-4", phone: "0981" })).toContain("0981"));
});
