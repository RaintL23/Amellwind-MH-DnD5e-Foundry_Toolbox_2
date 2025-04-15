import { getMonsterDescription } from "@/api/monsters/monstersClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Monster from "@/models/monster/monster";

interface GetRunesDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  monster?: Monster;
}

export function GetRunesDialog({
  open,
  setOpen,
  monster,
}: GetRunesDialogProps) {
  // const [inputValue, setInputValue] = useState("");
  // const [monsterData, setMonsterData] = useState<Monster | undefined>(
  //   undefined
  // );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[70vw]">
        <DialogHeader>
          <DialogTitle>{monster ? monster.name : "No content"}</DialogTitle>
          <DialogDescription>
            {monster ? getMonsterDescription(monster) : "No content"}
          </DialogDescription>
        </DialogHeader>
        {monster ? (
          <div className="space-y-2">
            <p>{monster.name}</p>
          </div>
        ) : (
          <p>No hay información disponible.</p>
        )}
        {/* <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div> */}
        {/* <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
