// @ts-nocheck
/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * Touch manager class.
 */
export class TouchManager {
  /**
   * Constructor
   */
  constructor() {
    this._startX = 0.0;
    this._startY = 0.0;
    this._lastX = 0.0;
    this._lastY = 0.0;
    this._lastX1 = 0.0;
    this._lastY1 = 0.0;
    this._lastX2 = 0.0;
    this._lastY2 = 0.0;
    this._lastTouchDistance = 0.0;
    this._deltaX = 0.0;
    this._deltaY = 0.0;
    this._scale = 1.0;
    this._touchSingle = false;
    this._flipAvailable = false;
  }

  public getCenterX(): number {
    return this._lastX;
  }

  public getCenterY(): number {
    return this._lastY;
  }

  public getDeltaX(): number {
    return this._deltaX;
  }

  public getDeltaY(): number {
    return this._deltaY;
  }

  public getStartX(): number {
    return this._startX;
  }

  public getStartY(): number {
    return this._startY;
  }

  public getScale(): number {
    return this._scale;
  }

  public getX(): number {
    return this._lastX;
  }

  public getY(): number {
    return this._lastY;
  }

  public getX1(): number {
    return this._lastX1;
  }

  public getY1(): number {
    return this._lastY1;
  }

  public getX2(): number {
    return this._lastX2;
  }

  public getY2(): number {
    return this._lastY2;
  }

  public isSingleTouch(): boolean {
    return this._touchSingle;
  }

  public isFlickAvailable(): boolean {
    return this._flipAvailable;
  }

  public disableFlick(): void {
    this._flipAvailable = false;
  }

  /**
   * Touch start event
   * @param deviceX x-coordinate of touch point on screen
   * @param deviceY y-coordinate of touch point on screen
   */
  public touchesBegan(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._startX = deviceX;
    this._startY = deviceY;
    this._lastTouchDistance = -1.0;
    this._flipAvailable = true;
    this._touchSingle = true;
  }

  /**
   * Drag event
   * @param deviceX x-coordinate of touch point on screen
   * @param deviceY y-coordinate of touch point on screen
   */
  public touchesMoved(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._lastTouchDistance = -1.0;
    this._touchSingle = true;
  }

  /**
   * Measure flick distance
   * @return Flick distance
   */
  public getFlickDistance(): number {
    return this.calculateDistance(
      this._startX,
      this._startY,
      this._lastX,
      this._lastY
    );
  }

  /**
   * Calculate distance between two points
   *
   * @param x1 x-coordinate of first touch point on screen
   * @param y1 y-coordinate of first touch point on screen
   * @param x2 x-coordinate of second touch point on screen
   * @param y2 y-coordinate of second touch point on screen
   */
  public calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  /**
   * Calculate movement amount from two values.
   * Returns 0 if directions differ. If directions are same, refers to the smaller absolute value.
   *
   * @param v1 First movement amount
   * @param v2 Second movement amount
   *
   * @return The smaller movement amount
   */
  public calculateMovingAmount(v1: number, v2: number): number {
    if (v1 > 0.0 != v2 > 0.0) {
      return 0.0;
    }

    const sign: number = v1 > 0.0 ? 1.0 : -1.0;
    const absoluteValue1 = Math.abs(v1);
    const absoluteValue2 = Math.abs(v2);
    return (
      sign * (absoluteValue1 < absoluteValue2 ? absoluteValue1 : absoluteValue2)
    );
  }

  /**
   * Touch end event
   * @param deviceX x-coordinate
   * @param deviceY y-coordinate
   */
  public touchesEnded(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._touchSingle = false;
  }

  _startY: number; // y-coordinate when touch started
  _startX: number; // x-coordinate when touch started
  _lastX: number; // x-coordinate for single touch
  _lastY: number; // y-coordinate for single touch
  _lastX1: number; // x-coordinate of first touch point in double touch
  _lastY1: number; // y-coordinate of first touch point in double touch
  _lastX2: number; // x-coordinate of second touch point in double touch
  _lastY2: number; // y-coordinate of second touch point in double touch
  _lastTouchDistance: number; // Distance between fingers when touching with 2 or more fingers
  _deltaX: number; // x-axis movement distance from previous value to current value
  _deltaY: number; // y-axis movement distance from previous value to current value
  _scale: number; // Scale factor to multiply this frame. 1 except during scaling operation
  _touchSingle: boolean; // true during single touch
  _flipAvailable: boolean; // Whether flip is available
}
