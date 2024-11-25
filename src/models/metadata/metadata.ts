import Source from "./source";

export default interface Metadata {
    id: number;
    source: Source;
    status: string;
    dateAdded: number;
    dateLastModified: number;
    _dateLastModifiedHash: string;
    edition: string;
}