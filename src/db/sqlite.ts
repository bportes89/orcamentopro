import "@/lib/uuid";

import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";

export const DATABASE_NAME = "orcamentopro.db";

export const sqlite = openDatabaseSync(DATABASE_NAME);

sqlite.execSync("PRAGMA journal_mode = WAL;");
sqlite.execSync("PRAGMA foreign_keys = ON;");
sqlite.execSync("PRAGMA busy_timeout = 5000;");

export const db = drizzle(sqlite, { schema });
