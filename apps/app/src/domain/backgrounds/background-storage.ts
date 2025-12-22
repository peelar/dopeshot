import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  PERSONAL_BACKGROUND_BUCKET,
  PRESET_BACKGROUND_BUCKET,
} from "./constants";

const SIGNED_URL_TTL_SECONDS = 3600;

export async function signPresetBackground(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) {
    return path;
  }
  const { data, error } = await supabaseAdmin.storage
    .from(PRESET_BACKGROUND_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    return null;
  }
  return data?.signedUrl ?? null;
}

export async function signPersonalBackground(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(PERSONAL_BACKGROUND_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    return null;
  }
  return data?.signedUrl ?? null;
}
