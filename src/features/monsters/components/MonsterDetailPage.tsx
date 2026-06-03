import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Monster } from "@/shared/types";
import { getMonsterById } from "../services/monster.service";
import { MonsterStatBlock } from "./MonsterStatBlock";
import { MonsterDetailHeader } from "./detail/MonsterDetailHeader";
import { MonsterDetailLoading } from "./detail/MonsterDetailLoading";
import { MonsterDetailNotFound } from "./detail/MonsterDetailNotFound";

export function MonsterDetailPage() {
  const { monsterId: monsterIdParam } = useParams<{ monsterId: string }>();
  const monsterId = monsterIdParam ? decodeURIComponent(monsterIdParam) : "";

  const [monster, setMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!monsterId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void getMonsterById(monsterId).then((result) => {
      if (cancelled) return;
      if (!result) {
        setMonster(null);
        setNotFound(true);
      } else {
        setMonster(result);
        setNotFound(false);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [monsterId]);

  if (loading) {
    return <MonsterDetailLoading />;
  }

  if (notFound || !monster) {
    return <MonsterDetailNotFound />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <MonsterDetailHeader monster={monster} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full min-w-[18rem] space-y-4 px-20">
          {monster.fluff && (
            <p className="text-sm text-muted-foreground italic leading-relaxed border-l-2 border-amber-800/40 pl-3">
              {monster.fluff}
            </p>
          )}
          <MonsterStatBlock monster={monster} />
        </div>
      </div>
    </div>
  );
}
