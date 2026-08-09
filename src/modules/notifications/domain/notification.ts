export function markNotificationRead(notification: { readAt: Date | null }, now = new Date()) {
  return { ...notification, readAt: notification.readAt ?? now };
}
