import {
  getMonsterCarveTable,
  getMonsterDescription,
  getMonsterRunesByName,
} from "@/api/monsters/monstersClient";
import { DataTable } from "@/components/data-table-2/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Monster from "@/models/monster/monster";
import MonsterCarveTable from "@/models/monster/monsterCarveTable";
import { useEffect, useState } from "react";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { GetRandomNumer1to20, isNumberInRange } from "@/utils/helper";

interface GetRunesDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  monster?: Monster;
}

const RunesDialog = ({ open, setOpen, monster }: GetRunesDialogProps) => {
  const [monsterCarveTable, setMonsterCarveTable] =
    useState<MonsterCarveTable>();
  const [carvedRune, setCarvedRune] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (monster) {
      const data = getMonsterCarveTable(monster);
      setMonsterCarveTable(data);
      // console.log(data);
    }
    if (!open) {
      setCarvedRune(undefined); // Limpiar la variable carvedRune cuando se cierra el Dialog
    }
  }, [monster, open]);

  const handleCarve = () => {
    const randomNumber = GetRandomNumer1to20();
    let monsterRuneData = `Result: ${randomNumber}\n`;

    const matchedItem = monsterCarveTable?.items.find((item) =>
      isNumberInRange(item.carveRange, randomNumber)
    );

    if (matchedItem && monster) {
      const monsterRunes = getMonsterRunesByName(monster, matchedItem.runeName);

      if (monsterRunes?.length) {
        monsterRunes.forEach((rune) => {
          const runeType =
            typeof rune.type === "object" && rune.type?.type
              ? `(${rune.type.type})`
              : "";
          monsterRuneData += `${rune.name} ${runeType}\n${rune.effect}\n\n`;
        });

        setCarvedRune(monsterRuneData);
      }
    }
  };

  const handleCaptureCarve = () => {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[70vw] max-h-[80vh] overflow-y-auto space-y-4">
        <DialogHeader>
          <DialogTitle>{monster ? monster.name : "No content"}</DialogTitle>
          <DialogDescription>
            {monster ? getMonsterDescription(monster) : "No content"}
          </DialogDescription>
        </DialogHeader>

        {monster &&
        monsterCarveTable?.items &&
        monsterCarveTable?.items?.length > 0 ? (
          <div className="space-y-4">
            {/* DataTable */}
            <DataTable
              columns={columns}
              data={monsterCarveTable.items}
              hideControls={true}
            />

            {/* Botones Carve y Capture Carve */}
            <div className="flex space-x-4">
              <Button onClick={handleCarve} className="w-full sm:w-auto">
                Carve
              </Button>
              <Button onClick={handleCaptureCarve} className="w-full sm:w-auto">
                Capture Carve
              </Button>
            </div>

            {/* Resultado del Carve */}
            {carvedRune && (
              <p style={{ whiteSpace: "pre-line" }} className="mt-4">
                {carvedRune}
              </p>
            )}
          </div>
        ) : (
          <p>No hay información disponible.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RunesDialog;
