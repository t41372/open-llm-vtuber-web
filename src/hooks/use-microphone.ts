import { useState, useEffect, useContext } from 'react';
import { WebSocketContext } from '@/context/websocket-context';
import { AiStateContext } from '@/context/ai-state-context';
import { MicVAD } from "@ricky0123/vad-web"

let myvad: any = null;
let previousTriggeredProbability = 0;
let audioTaskQueue: any = null;
let ws: WebSocket | null = null;

export function useMicrophone() {
  const { sendMessage } = useContext(WebSocketContext)!;
  const { aiState, setAiState } = useContext(AiStateContext)!;
  const [micToggleState, setMicToggleState] = useState(false);

  useEffect(() => {
    if (ws === null) {
      ws = new WebSocket('ws://127.0.0.1:12393/client-ws');
    }
  }, []);

  const init_vad = async () => {
    myvad = await MicVAD.new({
      preSpeechPadFrames: 20,
      positiveSpeechThreshold: Number(localStorage.getItem('speechProbThreshold')) / 100,
      negativeSpeechThreshold: Number(localStorage.getItem('negativeSpeechThreshold')) / 100,
      redemptionFrames: parseInt(localStorage.getItem('redemptionFrames') || '20'),
      onSpeechStart: () => {
        console.log("Speech start detected: " + previousTriggeredProbability);
        if (aiState === "thinking-speaking") {
          interrupt();
        } else {
          console.log("😀👍 Not interrupted. Just normal conversation");
        }
      },
      onFrameProcessed: (probs: any) => {
        if (probs["isSpeech"] > previousTriggeredProbability) {
          previousTriggeredProbability = probs["isSpeech"];
        }
      },
      onVADMisfire: () => {
        console.log("VAD Misfire. The LLM can't hear you.");
        if (aiState === "interrupted") {
          setAiState("idle");
        }
        document.getElementById("message")!.textContent = "The LLM can't hear you.";
      },
      onSpeechEnd: (audio: Float32Array) => {
        audioTaskQueue.clearQueue();

        if (!micToggleState) {
          stopMic();
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
          sendAudioPartition(audio);
        }
      }
    });
  };

  const startMic = async () => {
    if (!myvad) {
      await init_vad();
    }
    setMicToggleState(true);
    await myvad.start();
  };

  const stopMic = async () => {
    setMicToggleState(false);
    if (myvad) {
      await myvad.pause();
    }
  };

  const sendAudioPartition = async (audio: Float32Array) => {
    const chunkSize = 4096;
    for (let index = 0; index < audio.length; index += chunkSize) {
      const endIndex = Math.min(index + chunkSize, audio.length);
      const chunk = audio.slice(index, endIndex);
      ws!.send(JSON.stringify({ type: "mic-audio-data", audio: chunk }));
    }
    ws!.send(JSON.stringify({ type: "mic-audio-end" }));
  };

  return {
    startMic,
    stopMic,
  };
}
