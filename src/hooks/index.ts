import config from "../../public/configSite.json";

const { modulos, debug } = config;

// Encuentra el módulo habilitado
const activeModule = modulos.find((module) => module.enabled);

if (!activeModule) {
  throw new Error("No active module found in configuration");
}

export const API_BASE_URL = activeModule.url;
export const DEBUG_MODE = debug;