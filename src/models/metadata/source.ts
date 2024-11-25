export default interface Source {
    id: number;
    json: string;
    abbreviation: string;
    full: string;
    authors: string[];
    convertedBy: string[];
    version: string;
    url: string;
    targetSchema: string;
}