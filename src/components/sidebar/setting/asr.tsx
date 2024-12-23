import { Stack, Text, NumberInput } from "@chakra-ui/react";
import { Field } from '@/components/ui/field';
import { useState, useEffect } from 'react';
import { settingStyles } from './setting-styles';

interface ASRProps {
  onSave?: (callback: () => void) => (() => void);
  onCancel?: (callback: () => void) => (() => void);
}

interface ASRSettings {
  speechProbThreshold: number;
  negativeSpeechThreshold: number;
  redemptionFrames: number;
}

interface ValueChangeDetails {
  value: string;
}

function ASR({ onSave, onCancel }: ASRProps) {
  const [settings, setSettings] = useState<ASRSettings>({
    speechProbThreshold: Number(localStorage.getItem('speechProbThreshold')) || 97,
    negativeSpeechThreshold: Number(localStorage.getItem('negativeSpeechThreshold')) || 15,
    redemptionFrames: Number(localStorage.getItem('redemptionFrames')) || 20,
  });
  const [originalSettings, setOriginalSettings] = useState<ASRSettings>(settings);

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(() => {
      handleSave();
    });

    const cleanupCancel = onCancel(() => {
      handleCancel();
    });

    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, settings]);

  const handleSave = () => {
    console.log("Set speechProbThreshold", settings.speechProbThreshold);
    console.log("Set negativeSpeechThreshold", settings.negativeSpeechThreshold);
    console.log("Set redemptionFrames", settings.redemptionFrames);
    localStorage.setItem('speechProbThreshold', settings.speechProbThreshold.toString());
    localStorage.setItem('negativeSpeechThreshold', settings.negativeSpeechThreshold.toString());
    localStorage.setItem('redemptionFrames', settings.redemptionFrames.toString());
    setOriginalSettings(settings);
  };

  const handleCancel = () => {
    setSettings(originalSettings);
  };

  const handleInputChange = (key: keyof ASRSettings, value: number | string) => {
    if (value === "" || value === "-") {
      setSettings(prev => ({ ...prev, [key]: value }));
    } else {
      const parsed = Number(value);
      if (!isNaN(parsed)) {
        setSettings(prev => ({ ...prev, [key]: parsed }));
      }
    }
  };

  return (
    <Stack {...settingStyles.live2d.container}>
      <Field 
        {...settingStyles.live2d.field} 
        label={<Text {...settingStyles.live2d.fieldLabel}>Speech Prob. Threshold</Text>}
      >
        <NumberInput.Root
          {...settingStyles.live2d.numberInput.root}
          value={settings.speechProbThreshold.toString()}
          onValueChange={(details: ValueChangeDetails) => handleInputChange('speechProbThreshold', details.value)}
          min={1}
          max={100}
        >
          <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Field>

      <Field 
        {...settingStyles.live2d.field} 
        label={<Text {...settingStyles.live2d.fieldLabel}>Negative Speech Threshold</Text>}
      >
        <NumberInput.Root
          {...settingStyles.live2d.numberInput.root}
          value={settings.negativeSpeechThreshold.toString()}
          onValueChange={(details: ValueChangeDetails) => handleInputChange('negativeSpeechThreshold', details.value)}
          min={0}
          max={100}
        >
          <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Field>

      <Field 
        {...settingStyles.live2d.field} 
        label={<Text {...settingStyles.live2d.fieldLabel}>Redemption Frames</Text>}
      >
        <NumberInput.Root
          {...settingStyles.live2d.numberInput.root}
          value={settings.redemptionFrames.toString()}
          onValueChange={(details: ValueChangeDetails) => handleInputChange('redemptionFrames', details.value)}
          min={1}
          max={100}
        >
          <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Field>
    </Stack>
  );
}

export default ASR; 
