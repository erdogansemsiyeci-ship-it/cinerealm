"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ── Shared types for form state (used by useActionState in the client component) ──

export type AuthFormState = {
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
  success?: boolean;
};

// ── Validation helpers ──

function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

// ── Login Action ────────────────────────────────────

export async function login(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = (formData.get("email") as string)?.trim() || "";
  const password = formData.get("password") as string || "";

  // Validate on server (belt-and-suspenders — client also validates)
  const errors: AuthFormState["errors"] = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = [emailError];
  if (passwordError) errors.password = [passwordError];
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Map Supabase error codes to user-friendly messages
    if (error.message?.includes("Invalid login credentials") || error.code === "invalid_credentials") {
      return { message: "Invalid email or password. Please try again." };
    }
    if (error.message?.includes("Email not confirmed")) {
      return { message: "Please confirm your email address before logging in." };
    }
    return { message: error.message || "An unexpected error occurred." };
  }

  // Successful login — redirect to home
  redirect("/");
}

// ── Signup Action ───────────────────────────────────

export async function signup(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = (formData.get("email") as string)?.trim() || "";
  const password = formData.get("password") as string || "";
  const confirmPassword = formData.get("confirmPassword") as string || "";

  // Validate
  const errors: AuthFormState["errors"] = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = [emailError];
  if (passwordError) errors.password = [passwordError];
  if (!confirmPassword) {
    errors.confirmPassword = ["Please confirm your password."];
  } else if (password !== confirmPassword) {
    errors.confirmPassword = ["Passwords do not match."];
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Redirect after email confirmation (if Supabase email confirm is enabled)
      // Falls through to immediate redirect if confirmations are disabled
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cinerealm.app"}/login`,
    },
  });

  if (error) {
    if (error.message?.includes("alstreamy registered") || error.code === "user_alstreamy_exists") {
      return { message: "An account with this email alstreamy exists. Try logging in instead." };
    }
    if (error.code === "weak_password") {
      return {
        errors: { password: ["Password is too weak. Try adding numbers or special characters."] },
      };
    }
    return { message: error.message || "An unexpected error occurred during signup." };
  }

  // If email confirmation is enabled, Supabase returns a user with identities length 0
  // Redirect to a confirmation page instead of directly logging in
  redirect("/login?signup=success");
}
