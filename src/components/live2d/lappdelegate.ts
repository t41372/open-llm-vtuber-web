// @ts-nocheck
/**
 * LAppDelegate - Core Application Delegate Class
 * 
 * This class serves as the main controller for the Live2D application.
 * It handles:
 * - Application lifecycle management
 * - WebGL initialization and management
 * - Resource management
 * - Event handling (touch/mouse interactions)
 * - Rendering loop control
 * 
 * The class follows a singleton pattern to ensure only one instance
 * manages the application state and resources.
 * 
 * @interface Public API
 * 
 * Initialization:
 * const delegate = LAppDelegate.getInstance();
 * delegate.initialize();  // Initialize the application
 * delegate.run();        // Start the rendering loop
 * 
 * Resource Management:
 * // Get texture manager
 * const textureManager = delegate.getTextureManager();
 * 
 * // Get view instance
 * const view = delegate.getView();
 * 
 * // Create shader program
 * const shader = delegate.createShader();
 * 
 * Event Handling:
 * ```typescript
 * // Handle window resize
 * window.addEventListener('resize', () => {
 *   delegate.onResize();
 * });
 * ```
 * 
 * Cleanup:
 * ```typescript
 * // Release resources and shutdown
 * LAppDelegate.releaseInstance();
 * ```
 * 
 * @note This class automatically handles touch/mouse events when initialized
 * @note Canvas size can be configured through LAppDefine.CanvasSize
 * @note WebGL context is managed internally
 */

import { CubismFramework, Option } from '../../Framework/src/live2dcubismframework';

import * as LAppDefine from './lappdefine';
import { LAppLive2DManager } from './lapplive2dmanager';
import { LAppPal } from './lapppal';
import { LAppTextureManager } from './lapptexturemanager';
import { LAppView } from './lappview';
import { canvas, gl } from './lappglmanager';

export let s_instance: LAppDelegate = null;
export let frameBuffer: WebGLFramebuffer = null;

/**
 * Application class.
 * Manages the Cubism SDK.
 */
export class LAppDelegate {
  /**
   * Returns the class instance (singleton).
   * Creates an instance internally if it hasn't been created.
   *
   * @return The class instance
   */
  public static getInstance(): LAppDelegate {
    if (s_instance == null) {
      s_instance = new LAppDelegate();
    }

    return s_instance;
  }

  /**
   * Releases the class instance (singleton).
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  /**
   * Initialize application requirements.
   */
  public initialize(): boolean {
    if (LAppDefine.CanvasSize === 'auto') {
      this._resizeCanvas();
    } else {
      canvas.width = LAppDefine.CanvasSize.width;
      canvas.height = LAppDefine.CanvasSize.height;
    }

    if (!frameBuffer) {
      frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    }

    // Enable transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const supportTouch: boolean = 'ontouchend' in canvas;

    if (supportTouch) {
      // Register touch-related callback functions
      canvas.addEventListener('touchstart', onTouchBegan, { passive: true });
      canvas.addEventListener('touchmove', onTouchMoved, { passive: true });
      canvas.addEventListener('touchend', onTouchEnded, { passive: true });
      canvas.addEventListener('touchcancel', onTouchCancel, { passive: true });
    } else {
      // Register mouse-related callback functions
      canvas.addEventListener('mousedown', onClickBegan, { passive: true });
      canvas.addEventListener('mousemove', onMouseMoved, { passive: true });
      canvas.addEventListener('mouseup', onClickEnded, { passive: true });
    }

    // Initialize AppView
    this._view.initialize();

    // Initialize Cubism SDK
    this.initializeCubism();

    return true;
  }

  /**
   * Resize canvas and re-initialize view.
   */
  public onResize(): void {
    this._resizeCanvas();
    this._view.initialize();
    this._view.initializeSprite();
  }

  /**
   * Release resources.
   */
  public release(): void {
    this._textureManager.release();
    this._textureManager = null;

    this._view.release();
    this._view = null;

    // Release resources
    LAppLive2DManager.releaseInstance();

    // Release Cubism SDK
    CubismFramework.dispose();
  }

  /**
   * Execute processing.
   */
  public run(): void {
    // Main loop
    const loop = (): void => {
      // Check if instance exists
      if (s_instance == null) {
        return;
      }

      // Update time
      LAppPal.updateTime();

      // Initialize screen
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // Enable depth test
      gl.enable(gl.DEPTH_TEST);

      // Near objects hide far objects
      gl.depthFunc(gl.LEQUAL);

      // Clear color buffer and depth buffer
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.clearDepth(1.0);

      // Enable transparency
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Update rendering
      this._view.render();

      // Recursive call for loop
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * Register shader.
   */
  public createShader(): WebGLProgram {
    // Compile vertex shader
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

    if (vertexShaderId == null) {
      LAppPal.printMessage('failed to create vertexShader');
      return null;
    }

    const vertexShader: string =
      'precision mediump float;' +
      'attribute vec3 position;' +
      'attribute vec2 uv;' +
      'varying vec2 vuv;' +
      'void main(void)' +
      '{' +
      '   gl_Position = vec4(position, 1.0);' +
      '   vuv = uv;' +
      '}';

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);

    // Compile fragment shader
    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      LAppPal.printMessage('failed to create fragmentShader');
      return null;
    }

    const fragmentShader: string =
      'precision mediump float;' +
      'varying vec2 vuv;' +
      'uniform sampler2D texture;' +
      'void main(void)' +
      '{' +
      '   gl_FragColor = texture2D(texture, vuv);' +
      '}';

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);

    // Create program object
    const programId = gl.createProgram();
    gl.attachShader(programId, vertexShaderId);
    gl.attachShader(programId, fragmentShaderId);

    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);

    // Link
    gl.linkProgram(programId);

    gl.useProgram(programId);

    return programId;
  }

  /**
   * Get View information.
   */
  public getView(): LAppView {
    return this._view;
  }

  public getTextureManager(): LAppTextureManager {
    return this._textureManager;
  }

  /**
   * Constructor
   */
  constructor() {
    this._captured = false;
    this._mouseX = 0.0;
    this._mouseY = 0.0;
    this._isEnd = false;

    this._cubismOption = new Option();
    this._view = new LAppView();
    this._textureManager = new LAppTextureManager();
  }

  /**
   * Initialize Cubism SDK
   */
  public initializeCubism(): void {
    // setup cubism
    this._cubismOption.logFunction = LAppPal.printMessage;
    this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
    CubismFramework.startUp(this._cubismOption);

    // initialize cubism
    CubismFramework.initialize();

    // load model
    LAppLive2DManager.getInstance();

    LAppPal.updateTime();

    this._view.initializeSprite();
  }

  /**
   * Resize the canvas to fill the screen.
   */
  private _resizeCanvas(): void {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  _cubismOption: Option; // Cubism SDK Option
  _view: LAppView; // View information
  _captured: boolean; // Whether clicking
  _mouseX: number; // Mouse X coordinate
  _mouseY: number; // Mouse Y coordinate
  _isEnd: boolean; // Whether APP has ended
  _textureManager: LAppTextureManager; // Texture manager
}

/**
 * Called when clicked.
 */
function onClickBegan(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }
  LAppDelegate.getInstance()._captured = true;

  const posX: number = e.pageX;
  const posY: number = e.pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * Called when mouse pointer moves.
 */
function onMouseMoved(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * Called when click ends.
 */
function onClickEnded(e: MouseEvent): void {
  LAppDelegate.getInstance()._captured = false;
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * Called when touched.
 */
function onTouchBegan(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  LAppDelegate.getInstance()._captured = true;

  const posX = e.changedTouches[0].pageX;
  const posY = e.changedTouches[0].pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * Called when swiped.
 */
function onTouchMoved(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * Called when touch ends.
 */
function onTouchEnded(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * Called when touch is cancelled.
 */
function onTouchCancel(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
