import { createContext, useMemo, useContext, useState, useCallback } from 'react';
import { baseUrl } from '@/context/websocket-context';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

/**
 * Background file interface
 * @interface BackgroundFile
 */
interface BackgroundFile {
  name: string;
  url: string;
}

/**
 * Background URL context state interface
 * @interface BgUrlContextState
 */
export interface BgUrlContextState {
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  backgroundFiles: BackgroundFile[];
  setBackgroundFiles: (files: BackgroundFile[]) => void;
  resetBackground: () => void;
  addBackgroundFile: (file: BackgroundFile) => void;
  removeBackgroundFile: (name: string) => void;
  isDefaultBackground: boolean;
}

/**
 * Default values and constants
 */
const DEFAULT_BACKGROUND = `${baseUrl}/bg/ceiling-window-room-night.jpeg`;

/**
 * Create the background URL context
 */
const BgUrlContext = createContext<BgUrlContextState | null>(null);

/**
 * Background URL Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function BgUrlProvider({ children }: { children: React.ReactNode }) {
  // Local storage for persistent background URL
  const [backgroundUrl, setBackgroundUrl] = useLocalStorage<string>(
    'backgroundUrl',
    DEFAULT_BACKGROUND
  );

  // State for background files list
  const [backgroundFiles, setBackgroundFiles] = useState<BackgroundFile[]>([]);

  // Reset background to default
  const resetBackground = useCallback(() => {
    setBackgroundUrl(DEFAULT_BACKGROUND);
  }, [setBackgroundUrl]);

  // Add new background file
  const addBackgroundFile = useCallback((file: BackgroundFile) => {
    setBackgroundFiles(prev => [...prev, file]);
  }, []);

  // Remove background file
  const removeBackgroundFile = useCallback((name: string) => {
    setBackgroundFiles(prev => prev.filter(file => file.name !== name));
  }, []);

  // Check if current background is default
  const isDefaultBackground = useMemo(() => 
    backgroundUrl === DEFAULT_BACKGROUND,
    [backgroundUrl]
  );

  // Memoized context value
  const contextValue = useMemo(() => ({
    backgroundUrl,
    setBackgroundUrl,
    backgroundFiles,
    setBackgroundFiles,
    resetBackground,
    addBackgroundFile,
    removeBackgroundFile,
    isDefaultBackground
  }), [
    backgroundUrl,
    backgroundFiles,
    resetBackground,
    addBackgroundFile,
    removeBackgroundFile,
    isDefaultBackground
  ]);

  return (
    <BgUrlContext.Provider value={contextValue}>
      {children}
    </BgUrlContext.Provider>
  );
}

/**
 * Custom hook to use the background URL context
 * @throws {Error} If used outside of BgUrlProvider
 */
export function useBgUrl() {
  const context = useContext(BgUrlContext);
  
  if (!context) {
    throw new Error('useBgUrl must be used within a BgUrlProvider');
  }
  
  return context;
}
