// @ts-nocheck
/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * Cubism Platform Abstraction Layer that abstracts platform-dependent functionality.
 *
 * This class provides a platform abstraction layer for Cubism SDK, handling:
 * - File loading operations
 * - Time management and delta time calculations
 * - Debug message output
 *
 * @interface Public API
 * - loadFileAsBytes: Asynchronously loads file content as byte data
 * - getDeltaTime: Returns time elapsed since last frame
 * - updateTime: Updates internal time tracking
 * - printMessage: Outputs debug messages to console
 *
 * @static
 * - s_currentFrame: Current frame timestamp
 * - s_lastFrame: Previous frame timestamp
 * - s_deltaTime: Time difference between frames
 */
export class LAppPal {
  /**
   * Reads a file as byte data
   *
   * @param filePath Path to the file to be read
   * @return
   * {
   *      buffer,   Read byte data
   *      size      File size
   * }
   */
  public static loadFileAsBytes(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void
  ): void {
    fetch(filePath)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => callback(arrayBuffer, arrayBuffer.byteLength));
  }

  /**
   * Gets the delta time (difference from the previous frame)
   * @return Delta time [ms]
   */
  public static getDeltaTime(): number {
    return this.s_deltaTime;
  }

  public static updateTime(): void {
    this.s_currentFrame = Date.now();
    this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
    this.s_lastFrame = this.s_currentFrame;
  }

  /**
   * Outputs a message
   * @param message String
   */
  public static printMessage(message: string): void {
    console.log(message);
  }

  static lastUpdate = Date.now();

  static s_currentFrame = 0.0;
  static s_lastFrame = 0.0;
  static s_deltaTime = 0.0;
}
