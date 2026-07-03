import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Monster } from "@/shared/types";
import { getMonsterById } from "../services/monster.service";
import { MonsterStatBlock } from "./MonsterStatBlock";
import { MonsterCarvePanel } from "./detail/MonsterCarvePanel";
import { MonsterBioPanel } from "./detail/MonsterBioPanel";
import {
  MonsterDetailTabBar,
  type MonsterDetailTab,
} from "./detail/MonsterDetailTabBar";
import { MonsterDetailHeader } from "./detail/MonsterDetailHeader";
import { MonsterDetailLoading } from "./detail/MonsterDetailLoading";
import { MonsterDetailNotFound } from "./detail/MonsterDetailNotFound";

export function MonsterDetailPage() {
  const { monsterId: monsterIdParam } = useParams<{ monsterId: string }>();
  const monsterId = monsterIdParam ? decodeURIComponent(monsterIdParam) : "";

  const [monster, setMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<MonsterDetailTab>("statblock");

  useEffect(() => {
    if (!monsterId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setActiveTab("statblock");

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

      <div className="shrink-0 px-6 pt-4">
        <MonsterDetailTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full min-w-[18rem] px-4 md:px-12 lg:px-20">
          {activeTab === "statblock" && <MonsterStatBlock monster={monster} />}
          {activeTab === "bio" && <MonsterBioPanel monster={monster} />}
          {activeTab === "loot" && <MonsterCarvePanel monster={monster} />}
        </div>
      </div>
    </div>
  );
}
