import { useEffect, useState } from "react";
import {
  getBookSourceNames,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";

let cachedNames: BookSourceNameMap | null = null;
let loadPromise: Promise<BookSourceNameMap> | null = null;

function loadBookSourceNames(): Promise<BookSourceNameMap> {
  if (cachedNames) return Promise.resolve(cachedNames);
  if (!loadPromise) {
    loadPromise = getBookSourceNames().then((names) => {
      cachedNames = names;
      return names;
    });
  }
  return loadPromise;
}

export function useBookSourceNames(): BookSourceNameMap {
  const [bookNames, setBookNames] = useState<BookSourceNameMap>(
    cachedNames ?? {},
  );

  useEffect(() => {
    void loadBookSourceNames().then(setBookNames);
  }, []);

  return bookNames;
}

export function clearBookSourceNamesHookCache(): void {
  cachedNames = null;
  loadPromise = null;
}
