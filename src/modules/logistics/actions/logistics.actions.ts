"use server";

import { actualizarEstadoEnvio as updateDeliveryStatus, assignDelivery, reportFailedDelivery } from "@/modules/logistics/services/logistics.service";

export const actualizarEstadoEnvio = updateDeliveryStatus;
export async function asignarEntrega(input: { saleId: number; managerId: number; driverId?: number | null }) { return assignDelivery(input); }
export async function informarEntregaFallida(input: { saleId: number; reason: string }) { return reportFailedDelivery(input); }
