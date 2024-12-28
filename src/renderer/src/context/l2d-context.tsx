import { createContext, PropsWithChildren, useContext, useState } from 'react';

// import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";
export interface ModelInfo {
  name?: string;                  // Model name
  description?: string;           // Model description
  url: string;                    // Model URL
  kScale: number;                 // Scale factor
  initialXshift: number;          // Initial X position shift
  initialYshift: number;          // Initial Y position shift
  kXOffset?: number;             // X-axis offset coefficient
  idleMotionGroupName?: string;   // Idle motion group name
  emotionMap: {
    [key: string]: number | string;
  };
  pointerInteractive?: boolean;
}
interface L2DContextType {
  modelInfo?: ModelInfo;
  setModelInfo: (info: L2DContextType['modelInfo']) => void;
}

export const L2DContext = createContext<L2DContextType | null>(null);

export const L2DProvider = ({ children }: PropsWithChildren) => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | undefined>(undefined);

  return (
    <L2DContext.Provider value={{ modelInfo, setModelInfo }}>
      {children}
    </L2DContext.Provider>
  );
};

export function useL2D() {
  const context = useContext(L2DContext);
  if (!context) {
    throw new Error('useL2D must be used within a L2DProvider');
  }
  return context;
}

export default L2DProvider;