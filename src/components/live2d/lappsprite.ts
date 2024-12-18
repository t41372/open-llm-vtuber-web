// @ts-nocheck
/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { canvas, gl } from "./lappglmanager";

/**
 * LAppSprite - Sprite Implementation Class
 *
 * This class is responsible for managing sprites within the Live2D application.
 * It handles:
 * - Texture management
 * - Vertex and UV buffer management
 * - Rendering of sprites
 * - Hit detection for interaction
 *
 * The class provides methods to initialize, render, and release resources
 * associated with a sprite.
 *
 * @interface Public API
 *
 * Initialization:
 * const sprite = new LAppSprite(x, y, width, height, textureId);
 *
 * Rendering:
 * sprite.render(programId);
 *
 * Resource Management:
 * sprite.release();  // Release resources
 *
 * Hit Detection:
 * const isHit = sprite.isHit(pointX, pointY);
 *
 * @note This class assumes a WebGL context is available and initialized
 * @note The sprite's position and size are defined in screen coordinates
 * @note The class does not manage the lifecycle of the WebGL context
 */

/**
 * Class for implementing sprites
 *
 * Manages texture IDs and Rect
 */
export class LAppSprite {
  /**
   * Constructor
   * @param x            x coordinate
   * @param y            y coordinate
   * @param width        width
   * @param height       height
   * @param textureId    texture
   */
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    textureId: WebGLTexture
  ) {
    this._rect = new Rect();
    this._rect.left = x - width * 0.5;
    this._rect.right = x + width * 0.5;
    this._rect.up = y + height * 0.5;
    this._rect.down = y - height * 0.5;
    this._texture = textureId;
    this._vertexBuffer = null;
    this._uvBuffer = null;
    this._indexBuffer = null;

    this._positionLocation = null;
    this._uvLocation = null;
    this._textureLocation = null;

    this._positionArray = null;
    this._uvArray = null;
    this._indexArray = null;

    this._firstDraw = true;
  }

  /**
   * Release resources
   */
  public release(): void {
    this._rect = null;

    gl.deleteTexture(this._texture);
    this._texture = null;

    gl.deleteBuffer(this._uvBuffer);
    this._uvBuffer = null;

    gl.deleteBuffer(this._vertexBuffer);
    this._vertexBuffer = null;

    gl.deleteBuffer(this._indexBuffer);
    this._indexBuffer = null;
  }

  /**
   * Returns the texture
   */
  public getTexture(): WebGLTexture {
    return this._texture;
  }

  /**
   * Render the sprite
   * @param programId shader program
   */
  public render(programId: WebGLProgram): void {
    if (this._texture == null) {
      // Loading not completed
      return;
    }

    // First time drawing
    if (this._firstDraw) {
      // Get the location of the attribute variable
      this._positionLocation = gl.getAttribLocation(programId, "position");
      gl.enableVertexAttribArray(this._positionLocation);

      this._uvLocation = gl.getAttribLocation(programId, "uv");
      gl.enableVertexAttribArray(this._uvLocation);

      // Get the location of the uniform variable
      this._textureLocation = gl.getUniformLocation(programId, "texture");

      // Register uniform attributes
      gl.uniform1i(this._textureLocation, 0);

      // Initialize uv buffer and coordinates
      {
        this._uvArray = new Float32Array([
          1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        ]);

        // Create uv buffer
        this._uvBuffer = gl.createBuffer();
      }

      // Initialize vertex buffer and coordinates
      {
        const maxWidth = canvas.width;
        const maxHeight = canvas.height;

        // Vertex data
        this._positionArray = new Float32Array([
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5),
        ]);

        // Create vertex buffer
        this._vertexBuffer = gl.createBuffer();
      }

      // Initialize vertex index buffer
      {
        // Vertex data
        this._indexArray = new Uint16Array([0, 1, 2, 3, 2, 0]);

        // Create vertex index buffer
        this._indexBuffer = gl.createBuffer();
      }

      this._firstDraw = false;
    }

    // Register uv coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._uvArray, gl.STATIC_DRAW);

    // Register attribute attributes
    gl.vertexAttribPointer(this._uvLocation, 2, gl.FLOAT, false, 0, 0);

    // Register vertex coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._positionArray, gl.STATIC_DRAW);

    // Register attribute attributes
    gl.vertexAttribPointer(this._positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Create vertex index
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexArray, gl.DYNAMIC_DRAW);

    // Draw the model
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.drawElements(
      gl.TRIANGLES,
      this._indexArray.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }

  /**
   * Hit detection
   * @param pointX x coordinate
   * @param pointY y coordinate
   * @return boolean indicating if the point is within the sprite
   */
  public isHit(pointX: number, pointY: number): boolean {
    // Get screen size
    const { height } = canvas;

    // Y coordinate needs to be converted
    const y = height - pointY;

    return (
      pointX >= this._rect.left &&
      pointX <= this._rect.right &&
      y <= this._rect.up &&
      y >= this._rect.down
    );
  }

  _texture: WebGLTexture; // Texture
  _vertexBuffer: WebGLBuffer; // Vertex buffer
  _uvBuffer: WebGLBuffer; // UV vertex buffer
  _indexBuffer: WebGLBuffer; // Vertex index buffer
  _rect: Rect; // Rectangle

  _positionLocation: number;
  _uvLocation: number;
  _textureLocation: WebGLUniformLocation;

  _positionArray: Float32Array;
  _uvArray: Float32Array;
  _indexArray: Uint16Array;

  _firstDraw: boolean;
}

export class Rect {
  public left: number; // Left edge
  public right: number; // Right edge
  public up: number; // Upper edge
  public down: number; // Lower edge
}
