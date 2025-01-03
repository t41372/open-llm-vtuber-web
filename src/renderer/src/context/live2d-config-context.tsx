import { createContext, useContext, useState, useMemo } from "react";
import { useLocalStorage } from "@/hooks/utils/use-local-storage";

/**
 * Model emotion mapping interface
 * @interface EmotionMap
 */
interface EmotionMap {
  [key: string]: number | string;
}

/**
 * Motion weight mapping interface
 * @interface MotionWeightMap
 */
export interface MotionWeightMap {
  [key: string]: number;
}

/**
 * Tap motion mapping interface
 * @interface TapMotionMap
 */
export interface TapMotionMap {
  [key: string]: MotionWeightMap;
}

/**
 * Live2D model information interface
 * @interface ModelInfo
 */
export interface ModelInfo {
  /** Model name */
  name?: string;
  
  /** Model description */
  description?: string;
  
  /** Model URL */
  url: string;
  
  /** Scale factor */
  kScale: number | string;
  
  /** Initial X position shift */
  initialXshift: number | string;
  
  /** Initial Y position shift */
  initialYshift: number | string;
  
  /** X-axis offset coefficient */
  kXOffset?: number | string;
  
  /** Idle motion group name */
  idleMotionGroupName?: string;
  
  /** Emotion mapping configuration */
  emotionMap: EmotionMap;
  
  /** Enable pointer interactivity */
  pointerInteractive?: boolean;
  
  /** Tap motion mapping configuration */
  tapMotions?: TapMotionMap;
}

/**
 * Live2D configuration context state interface
 * @interface Live2DConfigState
 */
interface Live2DConfigState {
  modelInfo?: ModelInfo;
  setModelInfo: (info: ModelInfo | undefined) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_CONFIG = {
  modelInfo: undefined as ModelInfo | undefined,
  isLoading: false,
};

/**
 * Create the Live2D configuration context
 */
export const Live2DConfigContext = createContext<Live2DConfigState | null>(null);

/**
 * Live2D Configuration Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function Live2DConfigProvider({ children }: { children: React.ReactNode }) {
  // State management with local storage persistence
  const [modelInfo, setModelInfo] = useLocalStorage<ModelInfo | undefined>(
    "modelInfo",
    DEFAULT_CONFIG.modelInfo
  );
  
  // Loading state
  const [isLoading, setIsLoading] = useState(DEFAULT_CONFIG.isLoading);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      modelInfo,
      setModelInfo,
      isLoading,
      setIsLoading,
    }),
    [modelInfo, isLoading]
  );

  return (
    <Live2DConfigContext.Provider value={contextValue}>
      {children}
    </Live2DConfigContext.Provider>
  );
}

/**
 * Custom hook to use the Live2D configuration context
 * @throws {Error} If used outside of Live2DConfigProvider
 */
export function useLive2DConfig() {
  const context = useContext(Live2DConfigContext);

  if (!context) {
    throw new Error("useLive2DConfig must be used within a Live2DConfigProvider");
  }

  return context;
}

// Export the provider as default
export default Live2DConfigProvider;