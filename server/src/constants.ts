export const ROLES = ["employee", "reviewer", "admin"] as const;
export const DEDUCTION_TYPES = ["with_deduction", "without_deduction"] as const;
export const REQUEST_STATUSES = [
  "draft",
  "missing_info",
  "pending_review",
  "approved",
  "rejected",
  "syncing_to_iiko",
  "synced_to_iiko",
  "iiko_sync_failed",
] as const;
export const IIKO_SYNC_STATUSES = ["idle", "syncing", "synced", "failed"] as const;

export type Role = (typeof ROLES)[number];
export type DeductionType = (typeof DEDUCTION_TYPES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type IikoSyncStatus = (typeof IIKO_SYNC_STATUSES)[number];

export const REVIEWER_ROLES: Role[] = ["reviewer", "admin"];
