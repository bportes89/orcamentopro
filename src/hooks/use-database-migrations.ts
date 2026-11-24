import { useEffect } from "react";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import * as Sentry from "@sentry/react-native";

import migrations from "@/db/migrations/migrations";
import { db } from "@/db/sqlite";

export function useDatabaseMigrations() {
  const state = useMigrations(db, migrations);

  useEffect(() => {
    if (state.success) {
      console.log("migrations applied");
    }

    if (state.error) {
      Sentry.captureException(state.error, {
        tags: { origem: "migracoes_locais" },
      });
    }
  }, [state.success, state.error]);

  return state;
}
