import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pbpjizvbbvftvnakyiqn.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicGppenZiYnZmdHZuYWt5aXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzgzNDUsImV4cCI6MjA5NTYxNDM0NX0.nDGDovf-sKKXTV08GeRhS4-vj2gAKFIjFFqYokp_4aM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//
// =========================
// SIGN UP
// =========================
//
export async function signUp(
  username: string,
  email: string,
  password: string
) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanUsername) throw new Error("Username required");
  if (!cleanEmail) throw new Error("Email required");

  // Email format structural logic validation (e.g., rejecting a@a.c)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error("Invalid email. Top-Level Domain (TLD) must have at least 2 characters (e.g., .com, .org, not .c).");
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        username: cleanUsername,
      },
    },
  });

  if (error) throw error;

  // Create profile row (IMPORTANT for username login)
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username: cleanUsername,
      email: cleanEmail,
    });

    if (profileError) throw profileError;
  }

  return data;
}

//
// =========================
// LOGIN (USERNAME OR EMAIL)
// =========================
//
export async function login(identifier: string, password: string) {
  const input = identifier.trim().toLowerCase();

  if (!input) throw new Error("Username or email is required.");
  if (!password) throw new Error("Password is required.");

  let emailToUse = input;

  const isEmail = input.includes("@");

  // If username → convert to email via profiles table
  if (!isEmail) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", input)
      .maybeSingle();

    if (error) throw error;

    if (!data?.email) {
      throw new Error("Username not found.");
    }

    emailToUse = data.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (error) throw error;

  return data;
}

//
// =========================
// LOGOUT
// =========================
//
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

//
// =========================
// GET CURRENT USER
// =========================
//
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

//
// =========================
// GET USERNAME
// =========================
//
export async function getUsername(userId?: string) {
  const user = userId
    ? { id: userId }
    : (await supabase.auth.getUser()).data.user;

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data?.username ?? null;
}

//
// =========================
// SYNC USER PROGRESS IN SUPABASE SQL DATABASE
// =========================
//
export async function saveUserProgress(progressData: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("No authenticated user session found");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ progress: progressData })
    .eq("id", user.id);

  if (error) {
    throw error;
  }
}

export async function getUserProgress() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("progress")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.progress || null;
}

//
// =========================
// CHECK IF USER ACCOUNT IS ACTIVE & VALID IN SUPABASE
// =========================
//
export async function isCurrentUserActiveInSupabase(currentUsername?: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Case A: There is an active authenticated user session
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        const msg = profileError.message.toLowerCase();
        if (
          msg.includes("fetch") ||
          msg.includes("network") ||
          msg.includes("failed") ||
          msg.includes("load") ||
          msg.includes("cors")
        ) {
          return { valid: true }; // Network/CORS/Temporary error, assume valid to avoid false-positive logout
        }
        return { valid: true }; // Other database error, be conservative
      }

      if (!profile) {
        // User has an auth session, but their profile row is missing from the database. This means they were deleted!
        return { valid: false, reason: "profile_deleted" };
      }

      return { valid: true };
    }

    // Case B: No authenticated session is found.
    // We must check if the account was deleted by querying the profiles table for the username if provided.
    // If we can find a profile row for this username, the account was NOT deleted (they are just logged out or session expired).
    // If the query returns no row, then the account has been deleted in Supabase!
    if (currentUsername) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", currentUsername.trim().toLowerCase())
        .maybeSingle();

      if (profileError) {
        const msg = profileError.message.toLowerCase();
        if (
          msg.includes("fetch") ||
          msg.includes("network") ||
          msg.includes("failed") ||
          msg.includes("load") ||
          msg.includes("cors")
        ) {
          return { valid: true }; // Network/CORS/Temporary error, assume valid to avoid false-positive logout
        }
        return { valid: true };
      }

      if (!profile) {
        // The username is registered in localStorage, but no profile row exists for it in Supabase.
        // This means the user account has been deleted from Supabase!
        return { valid: false, reason: "profile_deleted" };
      }
    }

    // Otherwise, they are just not logged in (guest state or session expired but the account profile still exists).
    return { valid: true };
  } catch (e: any) {
    const msg = e.message?.toLowerCase() || "";
    if (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("failed") ||
      msg.includes("load") ||
      msg.includes("cors")
    ) {
      return { valid: true };
    }
    return { valid: true }; // Conservative fallback
  }
}