/** One source-book edition of an entity (PHB vs XPHB, …) for source switchers. */
export interface SourceVariant {
  id: string;
  source: string;
  page?: number;
}
