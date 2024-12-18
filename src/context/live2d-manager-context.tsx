import React, { createContext, useContext, useEffect } from 'react';
import { LAppLive2DManager } from '../components/live2d/lapplive2dmanager';

interface Live2DManagerContextType {
  manager: LAppLive2DManager | null;
}

export const Live2DManagerContext = createContext<Live2DManagerContextType>({
  manager: null
});

export const Live2DManagerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  useEffect(() => {
    const manager = LAppLive2DManager.getInstance();
    
    return () => {
      LAppLive2DManager.releaseInstance();
    };
  }, []);

  return (
    <Live2DManagerContext.Provider value={{ manager: LAppLive2DManager.getInstance() }}>
      {children}
    </Live2DManagerContext.Provider>
  );
}; 