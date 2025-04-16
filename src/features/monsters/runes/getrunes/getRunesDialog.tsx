import {
  getMonsterCarveTable,
  getMonsterDescription,
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

interface GetRunesDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  monster?: Monster;
}

const RunesDialog = ({ open, setOpen, monster }: GetRunesDialogProps) => {
  const [monsterCarveTable, setMonsterCarveTable] =
    useState<MonsterCarveTable>();

  useEffect(() => {
    if (monster) {
      const data = getMonsterCarveTable(monster);
      setMonsterCarveTable(data);
      // console.log(data);
    }
  }, [monster]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[70vw]">
        <DialogHeader>
          <DialogTitle>{monster ? monster.name : "No content"}</DialogTitle>
          <DialogDescription>
            {monster ? getMonsterDescription(monster) : "No content"}
          </DialogDescription>
        </DialogHeader>
        {monster &&
        monsterCarveTable?.items &&
        monsterCarveTable?.items?.length > 0 ? (
          <div>
            <DataTable
              columns={columns}
              data={monsterCarveTable.items}
              hideControls={true}
            />
            <Button>Carve</Button>
          </div>
        ) : (
          <p>No hay información disponible.</p>
        )}
        {/* <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};

export default RunesDialog;
