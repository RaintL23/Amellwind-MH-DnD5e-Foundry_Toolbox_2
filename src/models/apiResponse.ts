import Metadata from "./metadata/metadata";
import Monster from "./monster/monster";

export default interface ApiResponse {
    _meta: Metadata;
    monster: Monster[];
}