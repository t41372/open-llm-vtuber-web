import { useWebSocket } from '@/context/websocket-context';
import { useConfig } from '@/context/config-context';
import { useCallback } from 'react';
import { useInterrupt } from '@/components/canvas/live2d';
import { useVAD } from '@/context/vad-context';

export function useSwitchCharacter() {
  const { sendMessage } = useWebSocket();
  const { configFiles } = useConfig();
  const { interrupt } = useInterrupt();
  const { stopMic } = useVAD();
  const switchCharacter = useCallback((fileName: string) => {

    interrupt();
    stopMic();

    sendMessage({
      type: "switch-config",
      file: fileName
    });

    console.log("Switch Character fileName: ", fileName);
  }, [configFiles, sendMessage]);

  return { switchCharacter };
}