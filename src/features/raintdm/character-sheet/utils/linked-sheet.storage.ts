const LINKED_SHEET_KEY = "mh-play-sheet-linked-id";

export function getLinkedSheetId(): string | null {
  try {
    return localStorage.getItem(LINKED_SHEET_KEY);
  } catch {
    return null;
  }
}

export function setLinkedSheetId(id: string | null): void {
  try {
    if (id) localStorage.setItem(LINKED_SHEET_KEY, id);
    else localStorage.removeItem(LINKED_SHEET_KEY);
  } catch {
    // ignore
  }
}
