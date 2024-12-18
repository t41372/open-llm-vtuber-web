// @ts-nocheck
/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

export let canvas: HTMLCanvasElement = null;
export let gl: WebGLRenderingContext = null;
export let s_instance: LAppGlManager = null;

/**
 * WebGL manager class for Cubism SDK samples.
 *
 * Abstracts platform-dependent functions such as file loading and time retrieval.
 */
export class LAppGlManager {
  /**
   * Returns the instance of the class (singleton).
   * If the instance has not been created, it is created internally.
   *
   * @return Instance of the class
   */
  public static getInstance(): LAppGlManager {
    if (s_instance == null) {
      s_instance = new LAppGlManager();
    }

    return s_instance;
  }

  /**
   * Releases the instance of the class (singleton).
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  constructor() {
    
  }

  /**
   * Release.
   */
  public release(): void {}

  public setCanvas(canvasElement: HTMLCanvasElement): void {
    canvas = canvasElement;
    
    gl = canvas.getContext("webgl2");

    if (!gl) {
      console.error("Cannot initialize WebGL. This browser does not support.");
      gl = null;
      return;
    }
  }
}
