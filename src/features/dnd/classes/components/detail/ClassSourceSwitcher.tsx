import { memo } from "react";
import { Class } from "@/shared/types";
import {
  getFieldsDifferentFromVariant,
  type ClassVariantField,
} from "../../utils/class-variant.utils";
import type { BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import { SourceVariantSwitcher } from "@/shared/components/SourceVariantSwitcher";

interface ClassSourceSwitcherProps {
  variants: Class[];
  activeId: string;
  onSelect: (id: string) => void;
  varyingFields: ClassVariantField[];
  bookNames: BookSourceNameMap;
}

function classesDiffer(a: Class, b: Class): boolean {
  return getFieldsDifferentFromVariant(a, b).length > 0;
}

export const ClassSourceSwitcher = memo(function ClassSourceSwitcher({
  variants,
  activeId,
  onSelect,
  varyingFields,
  bookNames,
}: ClassSourceSwitcherProps) {
  return (
    <SourceVariantSwitcher
      variants={variants}
      activeId={activeId}
      onSelect={onSelect}
      bookNames={bookNames}
      accent="sky"
      size="md"
      showLabel={false}
      differs={varyingFields.length > 0 ? classesDiffer : undefined}
    />
  );
});
