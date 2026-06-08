import type { Class, Subclass } from "@/shared/types";

function classEdition(cls: Class): "classic" | "one" {
  if (cls.edition) return cls.edition;
  return cls.source === "XPHB" ? "one" : "classic";
}

function isNativeToClassBook(cls: Class, sc: Subclass): boolean {
  return sc.source === cls.source && sc.classSource === cls.source;
}

/**
 * Subclasses tied to this class book (PHB, XPHB, EFA, …) and matching rules edition.
 * XPHB lists legacy subclasses (classSource XPHB, source PHB/XGE/…) for reference;
 * only `edition: "one"` or native-book entries (e.g. EFA on EFA) are valid for 2024.
 */
export function subclassesForClassVariant(cls: Class): Subclass[] {
  const edition = classEdition(cls);

  return cls.subclasses.filter((sc) => {
    if (sc.classSource !== cls.source) return false;

    if (edition === "one") {
      if (isNativeToClassBook(cls, sc)) return true;
      return sc.edition === "one";
    }

    return sc.edition !== "one";
  });
}
