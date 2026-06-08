import { memo } from "react";
import { Class } from "@/shared/types";
import {
  getFieldsDifferentFromVariant,
  type ClassVariantField,
} from "../../utils/class-variant.utils";
import type { BookSourceNameMap } from "@/features/spells/services/book-source.service";
import { SourceVariantSwitcher } from "@/features/builder/components/shared/SourceVariantSwitcher";

interface ClassSourceSwitcherProps {
  variants: Class[];
  activeId: string;
  onSelect: (id: string) => void;
  varyingFields: ClassVariantField[];
  bookNames: BookSourceNameMap;
}

export const ClassSourceSwitcher = memo(function ClassSourceSwitcher({
  variants,
  activeId,
  onSelect,
  varyingFields,
  bookNames,
}: ClassSourceSwitcherProps) {
  const hasDiffs = varyingFields.length > 0;

  return (
    <SourceVariantSwitcher
      variants={variants}
      activeId={activeId}
      onSelect={onSelect}
      bookNames={bookNames}
      accent="sky"
      size="md"
      showLabel={false}
      renderBadgeExtra={(variant, isActive) => {
        if (isActive || !hasDiffs) return null;
        const cls = variants.find((v) => v.id === variant.id);
        if (!cls) return null;
        const differsFromOthers = variants.some(
          (other) =>
            other.id !== cls.id &&
            getFieldsDifferentFromVariant(cls, other).length > 0,
        );
        if (!differsFromOthers) return null;
        return (
          <span
            className="ml-1 text-amber-400"
            title="Differs from other sources"
          >
            •
          </span>
        );
      }}
    />
  );
});
