import { useEffect, useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { getWeaponIconUrlCandidates } from "../utils/weapon-icon.utils";

interface WeaponIconProps {
  weaponName: string;
  className?: string;
  fallbackClassName?: string;
}

export function WeaponIcon({
  weaponName,
  className,
  fallbackClassName,
}: WeaponIconProps) {
  const candidates = useMemo(
    () => getWeaponIconUrlCandidates(weaponName),
    [weaponName],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(false);
  }, [weaponName]);

  const iconUrl = candidates[candidateIndex];

  if (failed || !iconUrl) {
    return <Swords className={cn("h-5 w-5", fallbackClassName)} aria-hidden />;
  }

  return (
    <img
      src={iconUrl}
      alt=""
      aria-hidden
      className={cn("h-5 w-5 object-contain", className)}
      onError={() => {
        if (candidateIndex < candidates.length - 1) {
          setCandidateIndex((index) => index + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
