// @ts-nocheck
/**
 * LAppLive2DManager - Live2D Model Management Class
 *
 * This class manages all Live2D models in the application.
 * It handles:
 * - Model loading and initialization
 * - Model switching and scene management
 * - Model interaction (tap/drag events)
 * - Model rendering coordination
 *
 * @interface Public API
 *
 * Basic Usage:
 * const manager = LAppLive2DManager.getInstance();
 *
 * // Model Management
 * const model = manager.getModel(0);       // Get first model
 * manager.nextScene();                     // Switch to next model
 * manager.changeScene(2);                  // Switch to specific model
 *
 * // Interaction Handling
 * manager.onDrag(x, y);                   // Handle drag events
 * manager.onTap(x, y);                    // Handle tap events
 *
 * // Rendering
 * manager.onUpdate();                     // Update model state
 *
 * @note Models are loaded from paths defined in LAppDefine.ModelDir
 * @note Uses singleton pattern for global model management
 */

import { CubismMatrix44 } from "../../Framework/src/math/cubismmatrix44";
import { ACubismMotion } from "../../Framework/src/motion/acubismmotion";
import { csmVector } from "../../Framework/src/type/csmvector";

import * as LAppDefine from "./lappdefine";
import { canvas } from "./lappglmanager";
import { LAppModel } from "./lappmodel";
import { LAppPal } from "./lapppal";

export let s_instance: LAppLive2DManager = null;

/**
 * Class that manages CubismModel in the sample application.
 * Handles model generation and destruction, tap events, and model switching.
 */
export class LAppLive2DManager {
  /**
   * Returns the instance of the class (singleton).
   * If the instance has not been created, it creates the instance internally.
   *
   * @return The instance of the class
   */
  public static getInstance(): LAppLive2DManager {
    if (s_instance == null) {
      s_instance = new LAppLive2DManager();
    }

    return s_instance;
  }

  /**
   * Releases the instance of the class (singleton).
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance = void 0;
    }

    s_instance = null;
  }

  /**
   * Returns the model currently held in the scene.
   *
   * @param no The index value of the model list
   * @return The model instance. Returns NULL if the index value is out of range.
   */
  public getModel(no: number): LAppModel {
    if (no < this._models.getSize()) {
      return this._models.at(no);
    }

    return null;
  }

  /**
   * Releases all models currently held in the scene.
   */
  public releaseAllModel(): void {
    for (let i = 0; i < this._models.getSize(); i++) {
      this._models.at(i).release();
      this._models.set(i, null);
    }

    this._models.clear();
  }

  /**
   * Processes when the screen is dragged.
   *
   * @param x The X coordinate of the screen
   * @param y The Y coordinate of the screen
   */
  public onDrag(x: number, y: number): void {
    for (let i = 0; i < this._models.getSize(); i++) {
      const model: LAppModel = this.getModel(i);

      if (model) {
        model.setDragging(x, y);
      }
    }
  }

  /**
   * Processes when the screen is tapped.
   *
   * @param x The X coordinate of the screen
   * @param y The Y coordinate of the screen
   */
  public onTap(x: number, y: number): void {
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
      );
    }

    for (let i = 0; i < this._models.getSize(); i++) {
      if (this._models.at(i).hitTest(LAppDefine.HitAreaNameHead, x, y)) {
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage(
            `[APP]hit area: [${LAppDefine.HitAreaNameHead}]`
          );
        }
        this._models.at(i).setRandomExpression();
      } else if (this._models.at(i).hitTest(LAppDefine.HitAreaNameBody, x, y)) {
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage(
            `[APP]hit area: [${LAppDefine.HitAreaNameBody}]`
          );
        }
        this._models
          .at(i)
          .startRandomMotion(
            LAppDefine.MotionGroupTapBody,
            LAppDefine.PriorityNormal,
            this._finishedMotion
          );
      }
    }
  }

  /**
   * Processes when the screen is updated.
   * Performs model update processing and drawing processing.
   */
  public onUpdate(): void {
    const { width, height } = canvas;

    const modelCount: number = this._models.getSize();

    for (let i = 0; i < modelCount; ++i) {
      const projection: CubismMatrix44 = new CubismMatrix44();
      const model: LAppModel = this.getModel(i);

      if (model.getModel()) {
        if (model.getModel().getCanvasWidth() > 1.0 && width < height) {
          // When displaying a model that is longer than it is wide on a vertical window, scale is calculated based on the model's width
          model.getModelMatrix().setWidth(2.0);
          projection.scale(1.0, width / height);
        } else {
          projection.scale(height / width, 1.0);
        }

        // If necessary, multiply here
        if (this._viewMatrix != null) {
          projection.multiplyByMatrix(this._viewMatrix);
        }
      }

      model.update();
      model.draw(projection); // Pass by reference, so projection is modified.
    }
  }

  /**
   * Switches to the next scene.
   * In the sample application, model set switching is performed.
   */
  public nextScene(): void {
    const no: number = (this._sceneIndex + 1) % LAppDefine.ModelDirSize;
    this.changeScene(no);
  }

  /**
   * Switches scenes.
   * In the sample application, model set switching is performed.
   */
  public changeScene(index: number): void {
    this._sceneIndex = index;
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(`[APP]model index: ${this._sceneIndex}`);
    }

    // Determine the path to model3.json from the directory name in ModelDir[]
    // Make sure the directory name matches the name of model3.json.
    const model: string = LAppDefine.ModelDir[index];
    const modelPath: string = LAppDefine.ResourcesPath + model + "/";
    let modelJsonName: string = LAppDefine.ModelDir[index];
    modelJsonName += ".model3.json";

    this.releaseAllModel();
    this._models.pushBack(new LAppModel());
    this._models.at(0).loadAssets(modelPath, modelJsonName);
  }

  public setViewMatrix(m: CubismMatrix44) {
    for (let i = 0; i < 16; i++) {
      this._viewMatrix.getArray()[i] = m.getArray()[i];
    }
  }

  /**
   * Constructor
   */
  constructor() {
    this._viewMatrix = new CubismMatrix44();
    this._models = new csmVector<LAppModel>();
    this._sceneIndex = 0;
    this.changeScene(this._sceneIndex);
  }

  _viewMatrix: CubismMatrix44; // view matrix used for model drawing
  _models: csmVector<LAppModel>; // container for model instances
  _sceneIndex: number; // index value of the scene to be displayed
  // callback function for motion playback completion
  _finishedMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage("Motion Finished:");
    console.log(self);
  };

  /**
   * 获取当前显示的模型
   */
  public getCurrentModel(): LAppModel {
    if (this._models.getSize() <= 0) {
      return null;
    }
    
    // 返回第一个模型作为当前模型
    return this._models.at(0);
  }
}
