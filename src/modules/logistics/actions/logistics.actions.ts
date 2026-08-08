"use server";

import { actualizarEstadoEnvio as updateDeliveryStatus } from "@/modules/logistics/services/logistics.service";

export const actualizarEstadoEnvio = updateDeliveryStatus;
