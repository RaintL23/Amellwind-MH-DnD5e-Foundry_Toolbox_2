export function itemEntityKey(entity: {
  name: string;
  source: string;
}): string {
  return `${entity.name}|${entity.source}`.toLowerCase();
}

export function itemTypeKey(entity: {
  abbreviation: string;
  source: string;
}): string {
  return `${entity.abbreviation}|${entity.source}`.toLowerCase();
}

export function itemId(entity: { name: string; source: string }): string {
  return `${entity.source}::${entity.name}`;
}

export function unpackItemUid(uid: string): {
  name: string;
  source: string;
} {
  const pipe = uid.indexOf("|");
  if (pipe === -1) {
    return { name: uid, source: "" };
  }
  return {
    name: uid.slice(0, pipe),
    source: uid.slice(pipe + 1),
  };
}

export function unpackItemTypeUid(
  typeUid: string,
): { abbreviation: string; source: string } {
  const pipe = typeUid.indexOf("|");
  if (pipe === -1) {
    return { abbreviation: typeUid, source: "" };
  }
  return {
    abbreviation: typeUid.slice(0, pipe),
    source: typeUid.slice(pipe + 1),
  };
}
