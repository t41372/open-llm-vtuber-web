import React, { useEffect, useRef, useContext } from "react";
// import { L2DContext } from "@/context/l2d-context";
import { AiStateContext } from "@/context/ai-state-context";
import { SubtitleContext } from "@/context/subtitle-context";
import { ResponseContext } from "@/context/response-context";
import { WebSocketContext } from "@/context/websocket-context";
import { audioTaskQueue } from "@/utils/task-queue";
import { LAppLive2DManager } from "../live2d/lapplive2dmanager";
import { LAppDelegate } from "../live2d/lappdelegate";
import { LAppGlManager } from "../live2d/lappglmanager";
import * as LAppDefine from "../live2d/lappdefine";

export const Live2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resizeCanvas();

    const glManager = LAppGlManager.getInstance();
    glManager.setCanvas(canvasRef.current);

    if (!glManager || !LAppDelegate.getInstance().initialize()) {
      console.error("Failed to initialize Live2D GL Manager");
      return;
    }

    LAppDelegate.getInstance().run();

    const handleResize = () => {
      resizeCanvas();
      if (LAppDefine.CanvasSize === "auto") {
        LAppDelegate.getInstance().onResize();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      LAppDelegate.releaseInstance();
      LAppGlManager.releaseInstance();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    />
  );
};

interface AudioTaskOptions {
  audio_base64: string;
  volumes: number[];
  slice_length: number;
  text?: string | null;
  expression_list?: string[] | null;
}

export function useInterrupt() {
  const { setAiState } = useContext(AiStateContext)!;
  const { sendMessage } = useContext(WebSocketContext)!;
  const { fullResponse } = useContext(ResponseContext)!;

  const interrupt = () => {
    console.log("Interrupting conversation chain");
    sendMessage({
      type: "interrupt-signal",
      text: fullResponse,
    });
    setAiState("interrupted");

    const model = LAppLive2DManager.getInstance().getModel(0);
    if (model) {
      // model._wavFileHandler.stop();
    }

    audioTaskQueue.clearQueue();
    console.log("Interrupted!");
  };

  return { interrupt };
}

export function useAudioTask() {
  const { aiState } = useContext(AiStateContext)!;
  const { setSubtitleText } = useContext(SubtitleContext)!;
  const { appendResponse } = useContext(ResponseContext)!;

  const handleAudioPlayback = async (
    options: AudioTaskOptions,
    onComplete: () => void
  ) => {
    if (aiState === "interrupted") {
      console.error("Audio playback blocked. State:", aiState);
      onComplete();
      return;
    }

    const { audio_base64, text, expression_list } = options;

    if (text) {
      appendResponse(text);
      setSubtitleText(text);
    }

    const model = LAppLive2DManager.getInstance().getModel(0);
    if (!model) {
      console.error("Model not initialized");
      onComplete();
      return;
    }

    try {
      const byteCharacters = atob(audio_base64);
      const byteArray = new Uint8Array(byteCharacters.split('').map(char => char.charCodeAt(0)));
      const blob = new Blob([byteArray], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);

      if (model._wavFileHandler) {
        // 设置回调
        model._wavFileHandler.onFinish = () => {
          URL.revokeObjectURL(audioUrl);
          onComplete();
        };
        
        await model._wavFileHandler.playSound(audioUrl);
      } else {
        console.error("WavFileHandler not initialized");
        URL.revokeObjectURL(audioUrl);
        onComplete();
      }

      if (expression_list && expression_list[0]) {
        model.setExpression(expression_list[0]);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      onComplete();
    }
  };

  const addAudioTask = async (options: AudioTaskOptions) => {
    if (aiState === "interrupted") {
      console.log("Skipping audio task due to interrupted state");
      return;
    }

    console.log(`Adding audio task ${options.text} to queue`);

    audioTaskQueue.addTask(() =>
      new Promise<void>((resolve) => {
        handleAudioPlayback(options, resolve);
      }).catch((error) => {
        console.log("Audio task error:", error);
      })
    );
  };

  return {
    addAudioTask,
    appendResponse,
  };
}
