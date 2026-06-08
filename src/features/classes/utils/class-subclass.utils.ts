import type { Class, Subclass } from "@/shared/types";

function classEdition(cls: Class): "classic" | "one" {
  if (cls.edition) return cls.edition;
  return cls.source === "XPHB" ? "one" : "classic";
}

/**
 * Subclasses tied to this class book (PHB, XPHB, …) and matching rules edition.
 * XPHB lists legacy subclasses (classSource XPHB, source PHB/XGE/…) for reference;
 * only `edition: "one"` entries are valid for 2024 builds.
 */
export function subclassesForClassVariant(cls: Class): Subclass[] {
  const edition = classEdition(cls);

  return cls.subclasses.filter((sc) => {
    if (sc.classSource !== cls.source) return false;
    if (edition === "one") return sc.edition === "one";
    return sc.edition !== "one";
  });
}
