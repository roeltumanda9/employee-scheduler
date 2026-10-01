import { supabase } from "./supabase";

/**
 * Fetches the current user's profile (includes their role).
 * Returns null if not signed in.
 */
export async function getMyProfile() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userData.user.id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Permission helpers
 */
export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "User",
};

export function canManageEmployees(role) {
  return role === "super_admin";
}

export function canEditSchedules(role) {
  return role === "super_admin" || role === "admin";
}
