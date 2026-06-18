export type XdmgNpcNameRow = { roll: number; given: string; surname: string };

export type XdmgNpcNameTable = { id: string; name: string; rows: XdmgNpcNameRow[] };

export const XDMG_NPC_NAME_TABLES: XdmgNpcNameTable[] = [
  {
    "id": "1",
    "name": "Common Names",
    "rows": [
      {
        "roll": 1,
        "given": "Adrik",
        "surname": "Brightsun"
      },
      {
        "roll": 2,
        "given": "Alvyn",
        "surname": "Dundragon"
      },
      {
        "roll": 3,
        "given": "Aurora",
        "surname": "Frostbeard"
      },
      {
        "roll": 4,
        "given": "Eldeth",
        "surname": "Garrick"
      },
      {
        "roll": 5,
        "given": "Eldon",
        "surname": "Goodbarrel"
      },
      {
        "roll": 6,
        "given": "Farris",
        "surname": "Greycastle"
      },
      {
        "roll": 7,
        "given": "Kathra",
        "surname": "Ironfist"
      },
      {
        "roll": 8,
        "given": "Kellen",
        "surname": "Jaerin"
      },
      {
        "roll": 9,
        "given": "Lily",
        "surname": "Merryweather"
      },
      {
        "roll": 10,
        "given": "Nissa",
        "surname": "Redthorn"
      },
      {
        "roll": 11,
        "given": "Xinli",
        "surname": "Stormriver"
      },
      {
        "roll": 12,
        "given": "Zorra",
        "surname": "Wren"
      }
    ]
  },
  {
    "id": "2",
    "name": "Guttural Names",
    "rows": [
      {
        "roll": 1,
        "given": "Abzug",
        "surname": "Burska"
      },
      {
        "roll": 2,
        "given": "Bajok",
        "surname": "Gruuthok"
      },
      {
        "roll": 3,
        "given": "Bharash",
        "surname": "Hrondl"
      },
      {
        "roll": 4,
        "given": "Grovis",
        "surname": "Jarzzok"
      },
      {
        "roll": 5,
        "given": "Gruuna",
        "surname": "Kraltus"
      },
      {
        "roll": 6,
        "given": "Hokrun",
        "surname": "Shamog"
      },
      {
        "roll": 7,
        "given": "Mardred",
        "surname": "Skrangval"
      },
      {
        "roll": 8,
        "given": "Rhogar",
        "surname": "Ungart"
      },
      {
        "roll": 9,
        "given": "Skuldark",
        "surname": "Uuthrakt"
      },
      {
        "roll": 10,
        "given": "Thokk",
        "surname": "Vrakir"
      },
      {
        "roll": 11,
        "given": "Urzul",
        "surname": "Yuldra"
      },
      {
        "roll": 12,
        "given": "Varka",
        "surname": "Zulrax"
      }
    ]
  },
  {
    "id": "3",
    "name": "Lyrical Names",
    "rows": [
      {
        "roll": 1,
        "given": "Arannis",
        "surname": "Arvannis"
      },
      {
        "roll": 2,
        "given": "Damaia",
        "surname": "Brawnanvil"
      },
      {
        "roll": 3,
        "given": "Darsis",
        "surname": "Daardendrian"
      },
      {
        "roll": 4,
        "given": "Dweomer",
        "surname": "Drachedandion"
      },
      {
        "roll": 5,
        "given": "Evabeth",
        "surname": "Endryss"
      },
      {
        "roll": 6,
        "given": "Jhessail",
        "surname": "Meliamne"
      },
      {
        "roll": 7,
        "given": "Keyleth",
        "surname": "Mishann"
      },
      {
        "roll": 8,
        "given": "Netheria",
        "surname": "Silverfrond"
      },
      {
        "roll": 9,
        "given": "Orianna",
        "surname": "Snowmantle"
      },
      {
        "roll": 10,
        "given": "Sorcyl",
        "surname": "Summerbreeze"
      },
      {
        "roll": 11,
        "given": "Umarion",
        "surname": "Thunderfoot"
      },
      {
        "roll": 12,
        "given": "Velissa",
        "surname": "Zashir"
      }
    ]
  },
  {
    "id": "4",
    "name": "Monosyllabic Names",
    "rows": [
      {
        "roll": 1,
        "given": "Chen",
        "surname": "Dench"
      },
      {
        "roll": 2,
        "given": "Creel",
        "surname": "Drog"
      },
      {
        "roll": 3,
        "given": "Dain",
        "surname": "Dusk"
      },
      {
        "roll": 4,
        "given": "Dorn",
        "surname": "Holg"
      },
      {
        "roll": 5,
        "given": "Flint",
        "surname": "Horn"
      },
      {
        "roll": 6,
        "given": "Glim",
        "surname": "Imsh"
      },
      {
        "roll": 7,
        "given": "Henk",
        "surname": "Jask"
      },
      {
        "roll": 8,
        "given": "Krusk",
        "surname": "Keth"
      },
      {
        "roll": 9,
        "given": "Nox",
        "surname": "Ku"
      },
      {
        "roll": 10,
        "given": "Nyx",
        "surname": "Kung"
      },
      {
        "roll": 11,
        "given": "Rukh",
        "surname": "Mott"
      },
      {
        "roll": 12,
        "given": "Shan",
        "surname": "Quaal"
      }
    ]
  },
  {
    "id": "5",
    "name": "Sinister Names",
    "rows": [
      {
        "roll": 1,
        "given": "Arachne",
        "surname": "Doomwhisper"
      },
      {
        "roll": 2,
        "given": "Axyss",
        "surname": "Dreadfield"
      },
      {
        "roll": 3,
        "given": "Carrion",
        "surname": "Gallows"
      },
      {
        "roll": 4,
        "given": "Grinnus",
        "surname": "Hellstryke"
      },
      {
        "roll": 5,
        "given": "Melkhis",
        "surname": "Killraven"
      },
      {
        "roll": 6,
        "given": "Morthos",
        "surname": "Nightblade"
      },
      {
        "roll": 7,
        "given": "Nadir",
        "surname": "Norixius"
      },
      {
        "roll": 8,
        "given": "Scandal",
        "surname": "Shadowfang"
      },
      {
        "roll": 9,
        "given": "Skellendyre",
        "surname": "Valtar"
      },
      {
        "roll": 10,
        "given": "Thaltus",
        "surname": "Winterspell"
      },
      {
        "roll": 11,
        "given": "Valkora",
        "surname": "Xandros"
      },
      {
        "roll": 12,
        "given": "Vexander",
        "surname": "Zarkynzorn"
      }
    ]
  },
  {
    "id": "6",
    "name": "Whimsical Names",
    "rows": [
      {
        "roll": 1,
        "given": "Cricket",
        "surname": "Borogove"
      },
      {
        "roll": 2,
        "given": "Daisy",
        "surname": "Goldjoy"
      },
      {
        "roll": 3,
        "given": "Dimble",
        "surname": "Hoddypeak"
      },
      {
        "roll": 4,
        "given": "Ellywick",
        "surname": "Huddle"
      },
      {
        "roll": 5,
        "given": "Erky",
        "surname": "Jollywind"
      },
      {
        "roll": 6,
        "given": "Fiddlestyx",
        "surname": "Oneshoe"
      },
      {
        "roll": 7,
        "given": "Fonkin",
        "surname": "Scramblewise"
      },
      {
        "roll": 8,
        "given": "Golly",
        "surname": "Sunnyhill"
      },
      {
        "roll": 9,
        "given": "Mimsy",
        "surname": "Tallgrass"
      },
      {
        "roll": 10,
        "given": "Pumpkin",
        "surname": "Timbers"
      },
      {
        "roll": 11,
        "given": "Quarrel",
        "surname": "Underbough"
      },
      {
        "roll": 12,
        "given": "Sybilwick",
        "surname": "Wimbly"
      }
    ]
  }
];
