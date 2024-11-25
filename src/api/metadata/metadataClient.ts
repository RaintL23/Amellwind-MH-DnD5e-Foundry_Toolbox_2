import Metadata from "@/models/metadata/metadata";
import { fetchApiData } from "../client";

export const getMetadata = async (): Promise<Metadata> => {
    const data = await fetchApiData();
    return data._meta;
};