// @ts-nocheck
/**
 * LAppView - Rendering and Interaction View Class
 *
 * This class is responsible for managing the rendering and interaction
 * of the Live2D model within the application. It handles:
 * - Initialization of view matrices
 * - Rendering of background and gear sprites
 * - Handling touch and mouse events
 * - Transforming coordinates between device and view
 *
 * The class provides methods to initialize, render, and manage interactions
 * with the Live2D model.
 *
 * @interface Public API
 *
 * Initialization:
 * const view = new LAppView();
 * view.initialize();  // Initialize view settings
 *
 * Rendering:
 * view.render();  // Render the view
 *
 * Interaction:
 * view.onTouchesBegan(pointX, pointY);  // Handle touch start
 * view.onTouchesMoved(pointX, pointY);  // Handle touch move
 * view.onTouchesEnded(pointX, pointY);  // Handle touch end
 *
 * Coordinate Transformation:
 * const viewX = view.transformViewX(deviceX);
 * const viewY = view.transformViewY(deviceY);
 *
 * @note This class assumes a WebGL context is available and initialized
 * @note The view's coordinate system is defined in logical coordinates
 * @note The class does not manage the lifecycle of the WebGL context
 */

import { CubismMatrix44 } from "../../Framework/src/math/cubismmatrix44";
import { CubismViewMatrix } from "../../Framework/src/math/cubismviewmatrix";

import * as LAppDefine from "./lappdefine";
import { LAppDelegate } from "./lappdelegate";
import { canvas, gl } from "./lappglmanager";
import { LAppLive2DManager } from "./lapplive2dmanager";
import { LAppPal } from "./lapppal";
import { LAppSprite } from "./lappsprite";
import { TextureInfo } from "./lapptexturemanager";
import { TouchManager } from "./touchmanager";

/**
 * Rendering class.
 */
export class LAppView {
  /**
   * Constructor
   */
  constructor() {
    this._programId = null as unknown as WebGLProgram;
    this._back = null as unknown as LAppSprite;
    this._gear = null as unknown as LAppSprite;
    this._changeModel = false;
    this._isClick = false;

    // Touch event management
    this._touchManager = new TouchManager();

    // Matrix for converting from device coordinates to screen coordinates
    this._deviceToScreen = new CubismMatrix44();

    // Matrix for transforming the display's scaling and moving
    this._viewMatrix = new CubismViewMatrix();
  }

  /**
   * Initialize.
   */
  public initialize(): void {
    const { width, height } = canvas;

    const ratio: number = width / height;
    const left: number = -ratio;
    const right: number = ratio;
    const bottom: number = LAppDefine.ViewLogicalLeft;
    const top: number = LAppDefine.ViewLogicalRight;

    this._viewMatrix.setScreenRect(left, right, bottom, top); // Screen range corresponding to the device. X left, X right, Y bottom, Y top
    this._viewMatrix.scale(LAppDefine.ViewScale, LAppDefine.ViewScale);

    this._deviceToScreen.loadIdentity();
    if (width > height) {
      const screenW: number = Math.abs(right - left);
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    } else {
      const screenH: number = Math.abs(top - bottom);
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height);
    }
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // Set display range
    this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale); // Maximum scaling rate
    this._viewMatrix.setMinScale(LAppDefine.ViewMinScale); // Maximum scaling rate

    // Maximum displayable range
    this._viewMatrix.setMaxScreenRect(
      LAppDefine.ViewLogicalMaxLeft,
      LAppDefine.ViewLogicalMaxRight,
      LAppDefine.ViewLogicalMaxBottom,
      LAppDefine.ViewLogicalMaxTop
    );
  }

  /**
   * Release.
   */
  public release(): void {
    this._viewMatrix = null;
    this._touchManager = null;
    this._deviceToScreen = null;

    this._gear.release();
    this._gear = null;

    this._back.release();
    this._back = null;

    gl.deleteProgram(this._programId);
    this._programId = null;
  }

  /**
   * Render.
   */
  public render(): void {
    gl.useProgram(this._programId);

    if (this._back) {
      this._back.render(this._programId);
    }
    if (this._gear) {
      this._gear.render(this._programId);
    }

    gl.flush();

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();

    live2DManager.setViewMatrix(this._viewMatrix);

    live2DManager.onUpdate();
  }

  /**
   * Initialize images.
   */
  public initializeSprite(): void {
    const width: number = canvas.width;
    const height: number = canvas.height;

    const textureManager = LAppDelegate.getInstance().getTextureManager();
    const resourcesPath = LAppDefine.ResourcesPath;

    let imageName = "";

    // Initialize background image
    imageName = LAppDefine.BackImageName;

    // Create callback function for asynchronous loading
    const initBackGroundTexture = (textureInfo: TextureInfo): void => {
      const x: number = width * 0.5;
      const y: number = height * 0.5;

      const fwidth = width;
      const fheight = height;
      this._back = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initBackGroundTexture
    );

    // Initialize gear image
    imageName = LAppDefine.GearImageName;
    const initGearTexture = (textureInfo: TextureInfo): void => {
      const x = width - textureInfo.width * 0.5;
      const y = height - textureInfo.height * 0.5;
      const fwidth = textureInfo.width;
      const fheight = textureInfo.height;
      this._gear = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initGearTexture
    );

    // Create shader
    if (this._programId == null) {
      this._programId = LAppDelegate.getInstance().createShader();
    }
  }

  /**
   * Called when touched.
   *
   * @param pointX Screen X coordinate
   * @param pointY Screen Y coordinate
   */
  public onTouchesBegan(pointX: number, pointY: number): void {
    this._touchManager.touchesBegan(
      pointX * window.devicePixelRatio,
      pointY * window.devicePixelRatio
    );
  }

  /**
   * Called when the pointer moves while touching.
   *
   * @param pointX Screen X coordinate
   * @param pointY Screen Y coordinate
   */
  public onTouchesMoved(pointX: number, pointY: number): void {
    const viewX: number = this.transformViewX(this._touchManager.getX());
    const viewY: number = this.transformViewY(this._touchManager.getY());

    this._touchManager.touchesMoved(
      pointX * window.devicePixelRatio,
      pointY * window.devicePixelRatio
    );

    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(viewX, viewY);
  }

  /**
   * Called when touch ends.
   *
   * @param pointX Screen X coordinate
   * @param pointY Screen Y coordinate
   */
  public onTouchesEnded(pointX: number, pointY: number): void {
    // Touch ended
    const live2DManager: LAppLive2DManager = LAppLive2DManager.getInstance();
    live2DManager.onDrag(0.0, 0.0);

    {
      // Single tap
      const x: number = this._deviceToScreen.transformX(
        this._touchManager.getX()
      ); // Get coordinates after converting to logical coordinates.
      const y: number = this._deviceToScreen.transformY(
        this._touchManager.getY()
      ); // Get coordinates after converting to logical coordinates.

      if (LAppDefine.DebugTouchLogEnable) {
        LAppPal.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
      }
      live2DManager.onTap(x, y);

      // Did you tap the gear?
      if (
        this._gear.isHit(
          pointX * window.devicePixelRatio,
          pointY * window.devicePixelRatio
        )
      ) {
        live2DManager.nextScene();
      }
    }
  }

  /**
   * Convert X coordinate to View coordinate.
   *
   * @param deviceX Device X coordinate
   */
  public transformViewX(deviceX: number): number {
    const screenX: number = this._deviceToScreen.transformX(deviceX); // Get coordinates after converting to logical coordinates.
    return this._viewMatrix.invertTransformX(screenX); // Value after scaling, shrinking, and moving.
  }

  /**
   * Convert Y coordinate to View coordinate.
   *
   * @param deviceY Device Y coordinate
   */
  public transformViewY(deviceY: number): number {
    const screenY: number = this._deviceToScreen.transformY(deviceY); // Get coordinates after converting to logical coordinates.
    return this._viewMatrix.invertTransformY(screenY);
  }

  /**
   * Convert X coordinate to Screen coordinate.
   * @param deviceX Device X coordinate
   */
  public transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX);
  }

  /**
   * Convert Y coordinate to Screen coordinate.
   *
   * @param deviceY Device Y coordinate
   */
  public transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY);
  }

  _touchManager: TouchManager; // Touch manager
  _deviceToScreen: CubismMatrix44; // Matrix for converting from device coordinates to screen coordinates
  _viewMatrix: CubismViewMatrix; // viewMatrix
  _programId: WebGLProgram; // Shader ID
  _back: LAppSprite; // Background image
  _gear: LAppSprite; // Gear image
  _changeModel: boolean; // Model switching flag
  _isClick: boolean; // Clicking flag
}

