import type { Class, Subclass } from "@/shared/types";

/** Subclasses tied to this class book (PHB, XPHB, …), not other class reprints. */
export function subclassesForClassVariant(cls: Class): Subclass[] {
  return cls.subclasses.filter((sc) => sc.classSource === cls.source);
}
