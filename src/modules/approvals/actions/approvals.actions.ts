"use server";

import {
  approveRequest,
  rejectRequest,
  requestApproval,
  updateSelfApprovalPolicy,
} from "@/modules/approvals/services/approvals.service";

export async function requestApprovalAction(formData: FormData) {
  const rawValues = String(formData.get("proposedValues") ?? "{}");
  let proposedValues: unknown;
  try {
    proposedValues = JSON.parse(rawValues);
  } catch {
    throw new Error("Los valores propuestos deben ser JSON válido.");
  }

  await requestApproval({
    type: String(formData.get("type") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    entity: String(formData.get("entity") ?? "") || undefined,
    entityId: String(formData.get("entityId") ?? "") || undefined,
    proposedValues,
  });
}

export async function approveRequestAction(formData: FormData) {
  await approveRequest(Number(formData.get("requestId")));
}

export async function rejectRequestAction(formData: FormData) {
  await rejectRequest(Number(formData.get("requestId")));
}

export async function updateSelfApprovalPolicyAction(formData: FormData) {
  await updateSelfApprovalPolicy(formData.get("enabled") === "true");
}
