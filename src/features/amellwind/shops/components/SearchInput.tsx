import { ClearableSearchInput } from "@/shared/components/list-filters";

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <ClearableSearchInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mb-5"
      inputClassName="h-10 rounded-lg bg-card pl-9"
    />
  );
}
