import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import {
  Class,
  ClassFeatureEntry,
  ClassLevelRow,
  ClassTableGroup,
  Subclass,
} from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { SourceBadge } from "@/features/spells/components/SourceBadge";
import {
  getCasterLabel,
  mergeProgressionWithSubclass,
} from "../mappers/class.mapper";
import { getAllClasses, getClassById } from "../services/class.service";
import {
  getClassesByName,
  sortClassVariants,
} from "../utils/class-dedupe.utils";
import { subclassesForClassVariant } from "../utils/class-subclass.utils";
import {
  getFieldsDifferentFromVariant,
  getFieldsThatVaryAcrossVariants,
  type ClassVariantField,
} from "../utils/class-variant.utils";

const MetaRow = memo(function MetaRow({
  label,
  value,
  differs,
}: {
  label: string;
  value: string;
  differs?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32 shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-sm",
          differs ? "text-amber-300 font-medium" : "text-foreground",
        )}
      >
        {value}
        {differs && (
          <span className="ml-1.5 text-[10px] font-normal text-amber-500/80">
            (varies)
          </span>
        )}
      </span>
    </div>
  );
});

const MetaListSection = memo(function MetaListSection({
  heading,
  items,
  differs,
}: {
  heading: string;
  items: string[];
  differs?: boolean;
}) {
  if (!items.length) return null;

  return (
    <div className="space-y-1.5">
      <h4
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          differs ? "text-amber-400" : "text-muted-foreground",
        )}
      >
        {heading}
        {differs && (
          <span className="ml-1.5 text-[10px] font-normal normal-case text-amber-500/80">
            (varies)
          </span>
        )}
      </h4>
      <ul className="text-sm space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              "leading-relaxed text-[13px]",
              differs ? "text-amber-300/90" : "text-muted-foreground",
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
});

const FeatureChip = memo(function FeatureChip({
  feature,
  enabled,
  onToggle,
}: {
  feature: ClassFeatureEntry;
  enabled: boolean;
  onToggle: (uid: string) => void;
}) {
  const handleClick = useCallback(
    () => onToggle(feature.uid),
    [onToggle, feature.uid],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors text-left",
        enabled
          ? "border-sky-500 bg-sky-500/20 text-sky-200"
          : feature.isSubclassFeature
            ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-300/50 hover:bg-emerald-950/50"
            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
      )}
    >
      {feature.displayName}
      {feature.isSubclassFeature && (
        <span className="text-[9px] opacity-70">SC</span>
      )}
      {feature.source !== feature.name && feature.source && (
        <span className="text-[9px] opacity-50 font-normal">
          {feature.source}
        </span>
      )}
    </button>
  );
});

function getAllFeatureUids(progression: ClassLevelRow[]): string[] {
  return progression.flatMap((row) => row.features.map((feature) => feature.uid));
}

function allFeaturesEnabled(
  enabled: Set<string>,
  allUids: string[],
): boolean {
  return allUids.length > 0 && allUids.every((id) => enabled.has(id));
}

function setAllFeatureUids(allUids: string[]): Set<string> {
  return new Set(allUids);
}

function nextFeatureSelection(
  prev: Set<string>,
  uid: string,
  allUids: string[],
): Set<string> {
  const allSet = setAllFeatureUids(allUids);

  if (allFeaturesEnabled(prev, allUids)) {
    return new Set([uid]);
  }

  if (prev.has(uid)) {
    const next = new Set(prev);
    next.delete(uid);
    return next.size === 0 ? allSet : next;
  }

  const next = new Set(prev);
  next.add(uid);
  return next.size === allUids.length ? allSet : next;
}

const ClassLevelTable = memo(function ClassLevelTable({
  progression,
  tableGroups,
  enabledFeatureUids,
  onToggleFeature,
}: {
  progression: ClassLevelRow[];
  tableGroups: ClassTableGroup[];
  enabledFeatureUids: Set<string>;
  onToggleFeature: (uid: string) => void;
}) {
  const flatLabels = useMemo(
    () => tableGroups.flatMap((g) => g.colLabels),
    [tableGroups],
  );

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-10">
              Lvl
            </th>
            {flatLabels.map((label, i) => (
              <th
                key={`${label}-${i}`}
                className="px-2 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap"
              >
                {label}
              </th>
            ))}
            <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[180px]">
              Features
            </th>
          </tr>
        </thead>
        <tbody>
          {progression.map((row) => (
            <tr
              key={row.level}
              className="border-b border-border/50 last:border-0"
            >
              <td className="px-2 py-2 font-medium text-foreground align-top">
                {row.level}
              </td>
              {row.tableCells.map((cell, j) => (
                <td
                  key={j}
                  className="px-2 py-2 text-center text-muted-foreground align-top"
                >
                  {cell}
                </td>
              ))}
              <td className="px-2 py-2 align-top">
                <div className="flex flex-wrap gap-1">
                  {row.features.map((feature) => (
                    <FeatureChip
                      key={feature.uid}
                      feature={feature}
                      enabled={enabledFeatureUids.has(feature.uid)}
                      onToggle={onToggleFeature}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const FeatureDetailPanel = memo(function FeatureDetailPanel({
  feature,
}: {
  feature: ClassFeatureEntry;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="text-sm font-semibold text-sky-300">
          {feature.displayName}
        </h4>
        {feature.isSubclassFeature && (
          <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/50 text-[10px]">
            Subclass
          </Badge>
        )}
        <Badge variant="secondary" className="text-[10px]">
          {feature.source}
        </Badge>
      </div>
      {feature.description.length > 0 ? (
        <div className="space-y-1.5">
          {feature.description.map((line, i) => (
            <p
              key={i}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No description available.
        </p>
      )}
    </div>
  );
});

const FeatureDetailsPanel = memo(function FeatureDetailsPanel({
  features,
}: {
  features: ClassFeatureEntry[];
}) {
  if (features.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground italic">
        No features selected.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {features.map((feature) => (
        <FeatureDetailPanel key={feature.uid} feature={feature} />
      ))}
    </div>
  );
});

const SourceSwitcher = memo(function SourceSwitcher({
  variants,
  activeId,
  onSelect,
  varyingFields,
  bookNames,
}: {
  variants: Class[];
  activeId: string;
  onSelect: (id: string) => void;
  varyingFields: ClassVariantField[];
  bookNames: BookSourceNameMap;
}) {
  if (variants.length <= 1) return null;

  const hasDiffs = varyingFields.length > 0;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Source
      </p>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const isActive = v.id === activeId;
          const differsFromOthers =
            hasDiffs &&
            variants.some(
              (other) =>
                other.id !== v.id &&
                getFieldsDifferentFromVariant(v, other).length > 0,
            );
          const sourceTitle = resolveBookSourceName(bookNames, v.source);

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              title={sourceTitle !== v.source ? sourceTitle : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-sky-500 bg-sky-500/20 text-sky-300"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {v.source}
              {v.page !== undefined && (
                <span className="ml-1 opacity-70">p.{v.page}</span>
              )}
              {!isActive && differsFromOthers && (
                <span
                  className="ml-1 text-amber-400"
                  title="Differs from other sources"
                >
                  •
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const SubclassSelector = memo(function SubclassSelector({
  subclasses,
  activeSubclassId,
  onSelect,
  subclassTitle,
}: {
  subclasses: Subclass[];
  activeSubclassId: string;
  onSelect: (id: string) => void;
  subclassTitle?: string;
}) {
  if (subclasses.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {subclassTitle ?? "Subclass"}
      </p>
      <Select
        value={activeSubclassId}
        onChange={(e) => onSelect(e.target.value)}
        className="h-8 text-sm w-full max-w-md"
      >
        <option value="">— No subclass selected —</option>
        {subclasses.map((sc) => (
          <option key={sc.id} value={sc.id}>
            {sc.name}
            {sc.source !== sc.classSource ? ` (${sc.source})` : ""}
          </option>
        ))}
      </Select>
    </div>
  );
});

export function ClassDetailPage() {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const decodedId = classIdParam ? decodeURIComponent(classIdParam) : "";

  const [cls, setCls] = useState<Class | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeId, setActiveId] = useState("");
  const [activeSubclassId, setActiveSubclassId] = useState("");
  const [enabledFeatureUids, setEnabledFeatureUids] = useState<Set<string>>(
    () => new Set(),
  );
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});

  useEffect(() => {
    if (!decodedId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    Promise.all([getClassById(decodedId), getAllClasses(), getBookSourceNames()])
      .then(([found, classes, names]) => {
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
          setCls(null);
          return;
        }
        setCls(found);
        setAllClasses(classes);
        setBookNames(names);
        setActiveId(found.id);
        setActiveSubclassId("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [decodedId]);

  const variants = useMemo(() => {
    if (!cls) return [];
    const byName = getClassesByName(allClasses, cls.name);
    return byName.length > 0 ? sortClassVariants(byName) : [cls];
  }, [cls, allClasses]);

  const active = useMemo(
    () =>
      variants.find((v) => v.id === activeId) ??
      variants.find((v) => v.id === decodedId) ??
      variants[0] ??
      cls,
    [variants, activeId, decodedId, cls],
  );

  const variantSubclasses = useMemo(() => {
    if (!active) return [];
    return subclassesForClassVariant(active);
  }, [active]);

  const activeSubclass = useMemo(() => {
    if (!activeSubclassId) return null;
    return variantSubclasses.find((s) => s.id === activeSubclassId) ?? null;
  }, [variantSubclasses, activeSubclassId]);

  const mergedProgression = useMemo(() => {
    if (!active) return [];
    return mergeProgressionWithSubclass(active.progression, activeSubclass);
  }, [active, activeSubclass]);

  const allFeatureUids = useMemo(
    () => getAllFeatureUids(mergedProgression),
    [mergedProgression],
  );

  useEffect(() => {
    setEnabledFeatureUids(setAllFeatureUids(allFeatureUids));
  }, [allFeatureUids]);

  const toggleFeature = useCallback(
    (uid: string) => {
      setEnabledFeatureUids((prev) =>
        nextFeatureSelection(prev, uid, allFeatureUids),
      );
    },
    [allFeatureUids],
  );

  const handleSourceSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      setActiveSubclassId("");
      navigate(`/classes/${encodeURIComponent(id)}`, { replace: true });
    },
    [navigate],
  );

  const handleSubclassSelect = useCallback((id: string) => {
    setActiveSubclassId(id);
  }, []);

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(variants),
    [variants],
  );

  const differs = useMemo(() => {
    const set = new Set(varyingFields);
    return (field: ClassVariantField) => set.has(field);
  }, [varyingFields]);

  const enabledFeatures = useMemo(() => {
    const features: ClassFeatureEntry[] = [];
    for (const row of mergedProgression) {
      for (const feature of row.features) {
        if (enabledFeatureUids.has(feature.uid)) {
          features.push(feature);
        }
      }
    }
    return features;
  }, [mergedProgression, enabledFeatureUids]);

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <span className="text-sm">Loading class...</span>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !cls || !active) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <Link
            to="/classes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </Link>
          <h1 className="text-xl font-bold text-foreground">Class not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The requested class could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const hasSetupInfo =
    active.startingProficiencies.length > 0 ||
    active.startingEquipment.length > 0 ||
    active.multiclassing.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <Link
          to="/classes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-sky-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>

        <div className="flex items-start gap-3">
          <User className="h-6 w-6 text-sky-400 shrink-0 mt-1" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-sky-400">{active.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge variant="secondary">{active.hitDie}</Badge>
              <Badge variant="secondary">
                {getCasterLabel(active.casterProgression)}
              </Badge>
              {active.edition && (
                <Badge variant="secondary">
                  {active.edition === "one" ? "2024" : "2014"}
                </Badge>
              )}
              <SourceBadge source={active.source} bookNames={bookNames} />
              {active.page !== undefined && (
                <span className="text-xs text-muted-foreground">
                  p. {active.page}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <SourceSwitcher
            variants={variants}
            activeId={active.id}
            onSelect={handleSourceSelect}
            varyingFields={varyingFields}
            bookNames={bookNames}
          />

          <div
            className={cn(
              "grid gap-3",
              hasSetupInfo ? "lg:grid-cols-2" : "grid-cols-1",
            )}
          >
            <div className="space-y-1.5 p-3 rounded-md border border-border bg-muted/20">
              <MetaRow
                label="Hit Die"
                value={active.hitDie}
                differs={differs("hitDie")}
              />
              <MetaRow
                label="Spellcasting"
                value={getCasterLabel(active.casterProgression)}
                differs={differs("casterProgression")}
              />
              {active.spellcastingAbility && (
                <MetaRow
                  label="Spell Ability"
                  value={active.spellcastingAbility}
                  differs={differs("spellcastingAbility")}
                />
              )}
              <MetaRow
                label="Saving Throws"
                value={active.proficiencies.join(", ")}
                differs={differs("proficiencies")}
              />
              <MetaRow
                label="Subclasses"
                value={`${variantSubclasses.length} subclass${variantSubclasses.length === 1 ? "" : "es"}`}
                differs={differs("subclassCount")}
              />
              {hasSetupInfo && (
                <MetaListSection
                  heading="Multiclassing"
                  items={active.multiclassing}
                  differs={differs("multiclassing")}
                />
              )}
            </div>

            {hasSetupInfo && (
              <div className="space-y-4 p-3 rounded-md border border-border bg-muted/20">
                <MetaListSection
                  heading="Starting Proficiencies"
                  items={active.startingProficiencies}
                  differs={differs("startingProficiencies")}
                />
                <MetaListSection
                  heading="Starting Equipment"
                  items={active.startingEquipment}
                  differs={differs("startingEquipment")}
                />
              </div>
            )}
          </div>

          <SubclassSelector
            subclasses={variantSubclasses}
            activeSubclassId={activeSubclassId}
            onSelect={handleSubclassSelect}
            subclassTitle={active.subclassTitle}
          />

          <Separator />

          <ClassLevelTable
            progression={mergedProgression}
            tableGroups={active.spellProgression}
            enabledFeatureUids={enabledFeatureUids}
            onToggleFeature={toggleFeature}
          />

          <FeatureDetailsPanel features={enabledFeatures} />
        </div>
      </div>
    </div>
  );
}
