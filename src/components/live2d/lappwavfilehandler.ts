// @ts-nocheck
/**
 * LAppWavFileHandler - WAV File Handling Class
 *
 * This class is responsible for handling WAV file operations such as loading,
 * reading PCM data, and calculating RMS values. It provides methods to start
 * processing a WAV file, update its state, and retrieve audio data.
 *
 * The class was originally designed to follow a singleton pattern, but this
 * usage is now deprecated. It is recommended to create instances using the
 * constructor instead.
 *
 * @deprecated The singleton pattern usage in this class is deprecated.
 * Use `new LAppWavFileHandler()` instead.
 *
 * @interface Public API
 *
 * Initialization:
 * const handler = new LAppWavFileHandler();
 * handler.start(filePath);  // Start processing the WAV file
 *
 * Update:
 * handler.update(deltaTimeSeconds);  // Update the handler state
 *
 * Retrieve Data:
 * const rms = handler.getRms();  // Get the current RMS value
 * const pcmData = handler.getPcmDataChannel(channel);  // Get PCM data for a channel
 *
 * Cleanup:
 * handler.releasePcmData();  // Release PCM data resources
 *
 * @note This class handles WAV file loading and PCM data management.
 * @note The singleton pattern is deprecated; use direct instantiation.
 */

export let s_instance: LAppWavFileHandler = null;

export class LAppWavFileHandler {
  /**
   * Returns the class instance (singleton).
   * Creates an instance internally if it hasn't been created.
   *
   * @return The class instance
   * @deprecated The singleton pattern usage in this class is deprecated.
   * Use `new LAppWavFileHandler()` instead.
   */
  public static getInstance(): LAppWavFileHandler {
    if (s_instance == null) {
      s_instance = new LAppWavFileHandler();
    }

    return s_instance;
  }

  /**
   * Releases the class instance (singleton).
   *
   * @deprecated This function is deprecated as getInstance() is deprecated.
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance = void 0;
    }

    s_instance = null;
  }

  private _audioElement: HTMLAudioElement | null = null;
  public onFinish: (() => void) | null = null;

  public update(deltaTimeSeconds: number) {
    let goalOffset: number;
    let rms: number;

    // Do not update if data is not loaded or end of file is reached
    if (
      this._pcmData == null ||
      this._sampleOffset >= this._wavFileInfo._samplesPerChannel
    ) {
      this._lastRms = 0.0;
      return false;
    }

    // Maintain state after elapsed time
    this._userTimeSeconds += deltaTimeSeconds;
    goalOffset = Math.floor(
      this._userTimeSeconds * this._wavFileInfo._samplingRate
    );
    if (goalOffset > this._wavFileInfo._samplesPerChannel) {
      goalOffset = this._wavFileInfo._samplesPerChannel;
    }

    // RMS measurement
    rms = 0.0;
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      for (
        let sampleCount = this._sampleOffset;
        sampleCount < goalOffset;
        sampleCount++
      ) {
        const pcm = this._pcmData[channelCount][sampleCount];
        rms += pcm * pcm;
      }
    }
    rms = Math.sqrt(
      rms /
        (this._wavFileInfo._numberOfChannels *
          (goalOffset - this._sampleOffset))
    );

    this._lastRms = rms;
    this._sampleOffset = goalOffset;
    return true;
  }

  public start(filePath: string): void {
    // Reset state
    this._sampleOffset = 0;
    this._userTimeSeconds = 0.0;
    this._lastRms = 0.0;

    // Load WAV file
    this.loadWavFile(filePath);
  }

  public getRms(): number {
    return this._lastRms;
  }

  public loadWavFile(filePath: string): Promise<boolean> {
    return new Promise((resolveValue) => {
      let ret = false;

      if (this._pcmData != null) {
        this.releasePcmData();
      }

      // File loading
      const asyncFileLoad = async () => {
        return fetch(filePath).then((responce) => {
          return responce.arrayBuffer();
        });
      };

      const asyncWavFileManager = (async () => {
        this._byteReader._fileByte = await asyncFileLoad();
        this._byteReader._fileDataView = new DataView(
          this._byteReader._fileByte
        );
        this._byteReader._fileSize = this._byteReader._fileByte.byteLength;
        this._byteReader._readOffset = 0;

        // Fail if file loading failed or there is no space for the "RIFF" signature
        if (
          this._byteReader._fileByte == null ||
          this._byteReader._fileSize < 4
        ) {
          resolveValue(false);
          return;
        }

        // File name
        this._wavFileInfo._fileName = filePath;

        try {
          // Signature "RIFF"
          if (!this._byteReader.getCheckSignature("RIFF")) {
            ret = false;
            throw new Error('Cannot find Signature "RIFF".');
          }
          // File size - 8 (skip reading)
          this._byteReader.get32LittleEndian();
          // Signature "WAVE"
          if (!this._byteReader.getCheckSignature("WAVE")) {
            ret = false;
            throw new Error('Cannot find Signature "WAVE".');
          }
          // Signature "fmt "
          if (!this._byteReader.getCheckSignature("fmt ")) {
            ret = false;
            throw new Error('Cannot find Signature "fmt".');
          }
          // fmt chunk size
          const fmtChunkSize = this._byteReader.get32LittleEndian();
          // Only accept format ID 1 (Linear PCM)
          if (this._byteReader.get16LittleEndian() != 1) {
            ret = false;
            throw new Error("File is not linear PCM.");
          }
          // Number of channels
          this._wavFileInfo._numberOfChannels =
            this._byteReader.get16LittleEndian();
          // Sampling rate
          this._wavFileInfo._samplingRate =
            this._byteReader.get32LittleEndian();
          // Data speed [byte/sec] (skip reading)
          this._byteReader.get32LittleEndian();
          // Block size (skip reading)
          this._byteReader.get16LittleEndian();
          // Bits per sample
          this._wavFileInfo._bitsPerSample =
            this._byteReader.get16LittleEndian();
          // Skip reading the extended part of the fmt chunk
          if (fmtChunkSize > 16) {
            this._byteReader._readOffset += fmtChunkSize - 16;
          }
          // Skip until "data" chunk appears
          while (
            !this._byteReader.getCheckSignature("data") &&
            this._byteReader._readOffset < this._byteReader._fileSize
          ) {
            this._byteReader._readOffset +=
              this._byteReader.get32LittleEndian() + 4;
          }
          // "data" chunk did not appear in the file
          if (this._byteReader._readOffset >= this._byteReader._fileSize) {
            ret = false;
            throw new Error('Cannot find "data" Chunk.');
          }
          // Number of samples
          {
            const dataChunkSize = this._byteReader.get32LittleEndian();
            this._wavFileInfo._samplesPerChannel =
              (dataChunkSize * 8) /
              (this._wavFileInfo._bitsPerSample *
                this._wavFileInfo._numberOfChannels);
          }
          // Allocate space
          this._pcmData = new Array(this._wavFileInfo._numberOfChannels);
          for (
            let channelCount = 0;
            channelCount < this._wavFileInfo._numberOfChannels;
            channelCount++
          ) {
            this._pcmData[channelCount] = new Float32Array(
              this._wavFileInfo._samplesPerChannel
            );
          }
          // Get waveform data
          for (
            let sampleCount = 0;
            sampleCount < this._wavFileInfo._samplesPerChannel;
            sampleCount++
          ) {
            for (
              let channelCount = 0;
              channelCount < this._wavFileInfo._numberOfChannels;
              channelCount++
            ) {
              this._pcmData[channelCount][sampleCount] = this.getPcmSample();
            }
          }

          ret = true;

          resolveValue(ret);
        } catch (e) {
          console.log(e);
        }
      })().then(() => {
        resolveValue(ret);
      });
    });
  }

  public getPcmSample(): number {
    let pcm32;

    // Extend to 32-bit width and round to the range of -1 to 1
    switch (this._wavFileInfo._bitsPerSample) {
      case 8:
        pcm32 = this._byteReader.get8() - 128;
        pcm32 <<= 24;
        break;
      case 16:
        pcm32 = this._byteReader.get16LittleEndian() << 16;
        break;
      case 24:
        pcm32 = this._byteReader.get24LittleEndian() << 8;
        break;
      default:
        // Unsupported bit width
        pcm32 = 0;
        break;
    }

    return pcm32 / 2147483647; //Number.MAX_VALUE;
  }

  /**
   * Get an array of audio samples from the specified channel.
   *
   * @param usechannel The channel to use
   * @returns An array of audio samples from the specified channel
   */
  public getPcmDataChannel(usechannel: number): Float32Array {
    // Return null if the specified channel number is greater than the length of the data array.
    if (!this._pcmData || !(usechannel < this._pcmData.length)) {
      return null;
    }

    // Create a new Float32Array for the specified channel from _pcmData.
    return Float32Array.from(this._pcmData[usechannel]);
  }

  /**
   * Get the audio sampling frequency.
   *
   * @returns The audio sampling frequency
   */
  public getWavSamplingRate(): number {
    if (!this._wavFileInfo || this._wavFileInfo._samplingRate < 1) {
      return null;
    }

    return this._wavFileInfo._samplingRate;
  }

  public releasePcmData(): void {
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      delete this._pcmData[channelCount];
    }
    delete this._pcmData;
    this._pcmData = null;
  }

  public async playSound(audioUrl: string): Promise<void> {
    // Stop current audio if playing
    if (this._audioElement) {
      this._audioElement.pause();
      this._audioElement.src = '';
    }

    // Reset state
    this._userTimeSeconds = 0.0;
    this._sampleOffset = 0;
    this._lastRms = 0.0;

    // Load audio data
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.clone().arrayBuffer();
    
    // Create blobs for audio playback and WAV analysis
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const wavBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const audioPlayUrl = URL.createObjectURL(audioBlob);
    const wavAnalyzeUrl = URL.createObjectURL(wavBlob);

    // Initialize audio element
    const audioElement = new Audio(audioPlayUrl);
    this._audioElement = audioElement;

    // Handle audio completion
    audioElement.onended = () => {
      if (this._audioElement === audioElement) {
        // Cleanup resources
        URL.revokeObjectURL(audioPlayUrl);
        URL.revokeObjectURL(wavAnalyzeUrl);
        this._audioElement = null;
        this.releasePcmData();

        // Execute completion callback
        if (this.onFinish) {
          const callback = this.onFinish;
          this.onFinish = null;
          callback();
        }
      }
    };

    try {
      // Start audio playback and WAV analysis
      await Promise.all([
        audioElement.play(),
        this.loadWavFile(wavAnalyzeUrl)
      ]);
    } catch (error) {
      console.error("Error in playSound:", error);
      // Cleanup on error
      URL.revokeObjectURL(audioPlayUrl);
      URL.revokeObjectURL(wavAnalyzeUrl);
      if (this._audioElement === audioElement) {
        this._audioElement = null;
        this.releasePcmData();
      }
      // Execute error callback
      if (this.onFinish) {
        const callback = this.onFinish;
        this.onFinish = null;
        callback();
      }
    }
  }

  public stop(): void {
    if (this._audioElement) {
      this._audioElement.pause();
      this._audioElement.src = '';
      this._audioElement = null;
    }
    this.releasePcmData();
  }

  constructor() {
    this._pcmData = null;
    this._userTimeSeconds = 0.0;
    this._lastRms = 0.0;
    this._sampleOffset = 0.0;
    this._wavFileInfo = new WavFileInfo();
    this._byteReader = new ByteReader();
    this._audioElement = null;
  }

  _pcmData: Array<Float32Array>;
  _userTimeSeconds: number;
  _lastRms: number;
  _sampleOffset: number;
  _wavFileInfo: WavFileInfo;
  _byteReader: ByteReader;
  _loadFiletoBytes = (arrayBuffer: ArrayBuffer, length: number): void => {
    this._byteReader._fileByte = arrayBuffer;
    this._byteReader._fileDataView = new DataView(this._byteReader._fileByte);
    this._byteReader._fileSize = length;
  };
}

export class WavFileInfo {
  constructor() {
    this._fileName = "";
    this._numberOfChannels = 0;
    this._bitsPerSample = 0;
    this._samplingRate = 0;
    this._samplesPerChannel = 0;
  }

  _fileName: string; ///< File name
  _numberOfChannels: number; ///< Number of channels
  _bitsPerSample: number; ///< Bits per sample
  _samplingRate: number; ///< Sampling rate
  _samplesPerChannel: number; ///< Total samples per channel
}

export class ByteReader {
  constructor() {
    this._fileByte = null;
    this._fileDataView = null;
    this._fileSize = 0;
    this._readOffset = 0;
  }

  /**
   * @brief Read 8 bits
   * @return Csm::csmUint8 The read 8-bit value
   */
  public get8(): number {
    const ret = this._fileDataView.getUint8(this._readOffset);
    this._readOffset++;
    return ret;
  }

  /**
   * @brief Read 16 bits (little-endian)
   * @return Csm::csmUint16 The read 16-bit value
   */
  public get16LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 2;
    return ret;
  }

  /**
   * @brief Read 24 bits (little-endian)
   * @return Csm::csmUint32 The read 24-bit value (set in the lower 24 bits)
   */
  public get24LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 3;
    return ret;
  }

  /**
   * @brief Read 32 bits (little-endian)
   * @return Csm::csmUint32 The read 32-bit value
   */
  public get32LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 3) << 24) |
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 4;
    return ret;
  }

  /**
   * @brief Get signature and check for match with reference string
   * @param[in] reference The signature string to check
   * @retval  true    Matches
   * @retval  false   Does not match
   */
  public getCheckSignature(reference: string): boolean {
    const getSignature: Uint8Array = new Uint8Array(4);
    const referenceString: Uint8Array = new TextEncoder().encode(reference);
    if (reference.length != 4) {
      return false;
    }
    for (let signatureOffset = 0; signatureOffset < 4; signatureOffset++) {
      getSignature[signatureOffset] = this.get8();
    }
    return (
      getSignature[0] == referenceString[0] &&
      getSignature[1] == referenceString[1] &&
      getSignature[2] == referenceString[2] &&
      getSignature[3] == referenceString[3]
    );
  }

  _fileByte: ArrayBuffer; ///< Loaded file byte array
  _fileDataView: DataView;
  _fileSize: number; ///< File size
  _readOffset: number; ///< File reference position
}
