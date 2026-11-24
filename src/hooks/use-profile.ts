import { useCallback, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  ensureLocalProfile,
  getLocalProfile,
  saveLocalLogoUrl,
  saveLocalProfile,
  usePerfilCache,
  type SaveProfileParams,
} from "@/services/profiles";
import { uploadProfileLogo } from "@/services/storage";

export function useProfile() {
  const { user } = useAuth();
  const versao = usePerfilCache((state) => state.versao);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  void versao;
  const profile = user
    ? getLocalProfile(user.id) ?? ensureLocalProfile(user)
    : null;

  const save = useCallback(
    async (data: SaveProfileParams) => {
      if (!user) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      setSaving(true);

      try {
        saveLocalProfile(user.id, data);
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const changeLogo = useCallback(
    async (imageUri: string) => {
      if (!user) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      setUploadingLogo(true);

      try {
        const logoUrl = await uploadProfileLogo(user.id, imageUri);
        saveLocalLogoUrl(user.id, logoUrl);
        return logoUrl;
      } finally {
        setUploadingLogo(false);
      }
    },
    [user],
  );

  return {
    profile,
    saving,
    uploadingLogo,
    save,
    changeLogo,
  };
}
