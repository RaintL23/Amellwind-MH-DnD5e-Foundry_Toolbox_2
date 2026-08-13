import { DEFAULT_CLASS_SOURCE } from "./class-raw.types";

export function unpackClassFeatureUid(uid: string) {
  const [name, className, rawClassSource, levelStr, rawSource] = uid
    .split("|")
    .map((s) => s.trim());
  const classSource = rawClassSource || DEFAULT_CLASS_SOURCE;
  const source = rawSource || classSource;
  return {
    name,
    className,
    classSource,
    level: Number(levelStr),
    source,
  };
}

export function unpackSubclassFeatureUid(uid: string) {
  const [
    name,
    className,
    rawClassSource,
    subclassShortName,
    rawSubclassSource,
    levelStr,
    rawSource,
  ] = uid.split("|").map((s) => s.trim());
  const classSource = rawClassSource || DEFAULT_CLASS_SOURCE;
  const subclassSource = rawSubclassSource || DEFAULT_CLASS_SOURCE;
  const source = rawSource || subclassSource;
  return {
    name,
    className,
    classSource,
    subclassShortName,
    subclassSource,
    level: Number(levelStr),
    source,
  };
}

export function classFeatureKey(parts: {
  name: string;
  className: string;
  classSource: string;
  level: number;
  source: string;
}): string {
  return `${parts.name}|${parts.className}|${parts.classSource}|${parts.level}|${parts.source}`.toLowerCase();
}

export function subclassFeatureKey(parts: {
  name: string;
  className: string;
  classSource: string;
  subclassShortName: string;
  subclassSource: string;
  level: number;
  source: string;
}): string {
  return `${parts.name}|${parts.className}|${parts.classSource}|${parts.subclassShortName}|${parts.subclassSource}|${parts.level}|${parts.source}`.toLowerCase();
}

export function classIdentityKey(name: string, source: string): string {
  return `${name}|${source}`.toLowerCase();
}

export function subclassDefKey(parts: {
  name: string;
  source: string;
  className: string;
  classSource?: string;
}): string {
  const classSource = parts.classSource || DEFAULT_CLASS_SOURCE;
  return `${parts.name}|${parts.source}|${parts.className}|${classSource}`.toLowerCase();
}
