import { Directory, File, Paths } from "expo-file-system";

import { compressImageForUpload } from "@/lib/images";
import { supabase } from "@/services/supabase";

const LOGOS_BUCKET = "logos";

function getLogoDirectory(): Directory {
  return new Directory(Paths.document, "logos");
}

function getProfileLogoFile(userId: string): File {
  return new File(getLogoDirectory(), `${userId}.jpg`);
}

export async function cacheProfileLogo(
  userId: string,
  file: File,
): Promise<void> {
  getLogoDirectory().create({ intermediates: true, idempotent: true });
  await file.copy(getProfileLogoFile(userId), { overwrite: true });
}

export async function getProfileLogoDataUri(
  userId: string,
  logoUrl: string | null,
): Promise<string | null> {
  let file = getProfileLogoFile(userId);

  if (!file.exists && logoUrl) {
    try {
      getLogoDirectory().create({ intermediates: true, idempotent: true });
      file = await File.downloadFileAsync(logoUrl, file);
    } catch {
      return null;
    }
  }

  if (!file.exists) {
    return null;
  }

  try {
    const base64 = await file.base64();

    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

export async function uploadProfileLogo(
  userId: string,
  imageUri: string,
): Promise<string> {
  const file = await compressImageForUpload(imageUri);
  const bytes = await file.arrayBuffer();
  const path = `${userId}/logo.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });

  if (uploadError) {
    throw new Error(
      "Não foi possível enviar a logo. Verifique sua conexão e tente novamente.",
    );
  }

  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path);
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`;

  await supabase.from("profiles").update({ logo_url: logoUrl }).eq("id", userId);

  await cacheProfileLogo(userId, file);

  return logoUrl;
}
