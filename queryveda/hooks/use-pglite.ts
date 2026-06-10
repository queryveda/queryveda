"use client";

import { useEffect, useRef, useState } from "react";

export function usePGlite() {
  const dbRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { PGlite } = await import("@electric-sql/pglite");
        const db = new PGlite();
        await db.query("SELECT 1");
        if (!cancelled) {
          dbRef.current = db;
          setReady(true);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { db: dbRef.current, ready, error };
}
