import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "@/hooks/utils/use-local-storage";

/**
 * Character configuration file interface
 * @interface ConfigFile
 */
export interface ConfigFile {
  filename: string;
  name: string;
}

/**
 * Character configuration context state interface
 * @interface CharacterConfigState
 */
interface CharacterConfigState {
  confName: string;
  confUid: string;
  configFiles: ConfigFile[];
  setConfName: (name: string) => void;
  setConfUid: (uid: string) => void;
  setConfigFiles: (files: ConfigFile[]) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_CONFIG = {
  confName: "",
  confUid: "",
  configFiles: [] as ConfigFile[],
};

/**
 * Create the character configuration context
 */
export const ConfigContext = createContext<CharacterConfigState | null>(null);

/**
 * Character Configuration Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  // Local storage state management
  const [confName, setConfName] = useLocalStorage<string>(
    "confName",
    DEFAULT_CONFIG.confName
  );
  const [confUid, setConfUid] = useLocalStorage<string>(
    "confUid",
    DEFAULT_CONFIG.confUid
  );
  const [configFiles, setConfigFiles] = useLocalStorage<ConfigFile[]>(
    "configFiles",
    DEFAULT_CONFIG.configFiles
  );

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      confName,
      confUid,
      configFiles,
      setConfName,
      setConfUid,
      setConfigFiles,
    }),
    [confName, confUid, configFiles, setConfName, setConfUid, setConfigFiles]
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Custom hook to use the character configuration context
 * @throws {Error} If used outside of ConfigProvider
 */
export function useConfig() {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }

  return context;
}