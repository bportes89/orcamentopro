import { useEffect, type ReactNode } from "react";
import { usePathname } from "expo-router";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import * as Sentry from "@sentry/react-native";

import { useAuth } from "@/hooks/use-auth";

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const host =
  process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

function RastreadorDeTela() {
  const pathname = usePathname();
  const posthog = usePostHog();
  const { user } = useAuth();

  useEffect(() => {
    posthog.screen(pathname);
    posthog.setAppLanguage("pt-BR");

    Sentry.addBreadcrumb({
      category: "navegacao",
      message: `Tela: ${pathname}`,
      level: "info",
    });
  }, [pathname, posthog]);

  useEffect(() => {
    if (user) {
      posthog.identify(user.id);
    }
  }, [user, posthog]);

  return null;
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        host,
        flushAt: __DEV__ ? 1 : 20,
        captureAppLifecycleEvents: true,
      }}
      autocapture={{
        captureScreens: false,
        captureTouches: __DEV__,
      }}
    >
      <RastreadorDeTela />
      {children}
    </PostHogProvider>
  );
}
