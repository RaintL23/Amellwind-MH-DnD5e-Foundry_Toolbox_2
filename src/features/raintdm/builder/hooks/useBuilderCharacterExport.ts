import { useCallback, useState } from "react";
import { downloadBuilderCharacterJson } from "../builder-json";
import { useBuilderCharacterJson } from "./useBuilderCharacterJson";

export function useBuilderCharacterExport() {
  const buildJson = useBuilderCharacterJson();
  const [error, setError] = useState<string | null>(null);

  const exportCharacter = useCallback(() => {
    setError(null);
    try {
      downloadBuilderCharacterJson(buildJson());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export Builder JSON.",
      );
    }
  }, [buildJson]);

  return { exportCharacter, error };
}
