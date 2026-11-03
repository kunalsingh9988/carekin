"use client";
import { useCallback, useEffect, useState } from "react";

export function useResource<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    loader().then((data) => { if (active) setState({ data }); }).catch((error: unknown) => {
      if (active) setState({ error: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    });
    return () => { active = false; };
  }, [loader, version]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, reload };
}
