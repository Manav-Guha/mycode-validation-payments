export type SubscriptionState = { status: string; current_period_end: string | null };

export function hasSubscriptionAccess(subscription: SubscriptionState | null, now = new Date()) {
  if (!subscription) return false;
  if (subscription.status === "active" || subscription.status === "trialing") return true;
  return subscription.status === "past_due" && !!subscription.current_period_end && new Date(subscription.current_period_end) > now;
}

export function subscriptionMessage(subscription: SubscriptionState | null) {
  if (!subscription) return "No Reading Room membership is linked to this account.";
  if (subscription.status === "past_due") return "Your latest renewal payment is past due. Access remains available only through the shown paid-through date.";
  if (subscription.status === "active" && "cancel_at_period_end" in subscription && subscription.cancel_at_period_end) return "Your membership is active and will end after the current paid period.";
  return `Membership status: ${subscription.status.replaceAll("_", " ")}.`;
}
