export interface GuideTable {
  colLabels: string[];
  rows: string[][];
  footnotes?: string[];
}

export interface GuideInset {
  name: string;
  paragraphs: string[];
}

export interface GuideSubsection {
  name: string;
  paragraphs?: string[];
  table?: GuideTable;
  orderedList?: string[];
  inset?: GuideInset;
  subsections?: GuideSubsection[];
}

export interface GuideSection {
  id: string;
  name: string;
  page?: number;
  intro?: string[];
  paragraphs?: string[];
  subsections?: GuideSubsection[];
  skillEntries?: Array<{ name: string; description: string }>;
}

export interface BuilderWorkflowStep {
  step: number;
  title: string;
  description: string;
  link?: { to: string; label: string };
}
