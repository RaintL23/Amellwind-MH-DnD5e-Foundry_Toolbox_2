import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import Monster from "@/models/monster/monster";
import { getMonster } from "@/api/monsters/monstersClient";
import RunesDialog from "../../runes/getrunes/getRunesDialog";

interface DropdownMonsterMenuProps {
  // monster: Monster | undefined;
  monsterName: string;
}

export function DropdownMonsterMenu({ monsterName }: DropdownMonsterMenuProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [monster, setMonster] = useState<Monster | undefined>(undefined);

  useEffect(() => {
    const fetchMonster = async () => {
      const data = await getMonster(monsterName);
      setMonster(data);
    };

    fetchMonster();
  }, [monsterName]);

  if (!monster) return <div>...</div>; // o un Spinner o Skeleton

  // const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault(); // evita que cierre solo el menú
              setOpenMenu(false); // forzamos cierre del menú
              setTimeout(() => {
                setOpenDialog(true); // y luego abrimos el diálogo
              }, 0); // en el siguiente ciclo del render
            }}
          >
            Get Runes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RunesDialog
        open={openDialog}
        setOpen={setOpenDialog}
        monster={monster}
      />
    </>
  );
}
