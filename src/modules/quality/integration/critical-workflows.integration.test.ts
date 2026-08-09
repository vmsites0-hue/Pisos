import { describe, expect, it } from "vitest";
import { calculateSaleQuantity } from "../../inventory/domain/quantity-conversion";
import { allocateReservation } from "../../reservations/domain/reservation";
import { validateSaleCancellation } from "../../returns/domain/sale-cancellation";
import { inspectReturn } from "../../returns/domain/return-inspection";
import { validateDeliveryTransition } from "../../logistics/domain/delivery-state";
import { applyInstallmentPayment } from "../../credit/domain/installment-payment";

describe("critical commercial workflow integration", () => {
  it("converts, reserves and sells 10 m² as five complete 2.08 m² boxes", () => {
    const conversion = calculateSaleQuantity({ requestedQuantity: 10, conversionFactor: 2.08, policy: "SOLO_CAJAS_COMPLETAS", precision: 2 });
    expect(conversion).toMatchObject({ presentationQuantity: 5, actualQuantity: 10.4 });
    expect(allocateReservation(conversion.actualQuantity, [{ id: 1, physical: 20, reserved: 4 }])).toEqual([{ inventoryId: 1, quantity: 10.4 }]);
  });
  it("covers cancellation, return, delivery and collection boundaries", () => {
    expect(() => validateSaleCancellation({ estado: "PENDIENTE", alreadyCancelled: false, reason: "Error operativo" })).not.toThrow();
    expect(inspectReturn({ sold: 10.4, previouslyReturned: 0, requested: 2.08, condition: "DEFECTUOSO", quarantineEnabled: true }).lossQuantity).toBe(2.08);
    for (const [from, to] of [["PENDIENTE", "EN_PREPARACION"], ["EN_PREPARACION", "LISTO_DESPACHO"], ["LISTO_DESPACHO", "EN_CAMINO"], ["EN_CAMINO", "ENTREGADO"]]) expect(() => validateDeliveryTransition(from, to)).not.toThrow();
    expect(applyInstallmentPayment({ amountDue: 100, alreadyPaid: 20, payment: 80, dueDate: new Date() })).toMatchObject({ paid: 100, state: "PAGADA" });
  });
});
