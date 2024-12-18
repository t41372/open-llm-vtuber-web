// @ts-nocheck
/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmVector, iterator } from "../../Framework/src/type/csmvector";

import { gl } from "./lappglmanager";

/**
 * Texture management class.
 * Class for loading and managing images.
 */
export class LAppTextureManager {
  /**
   * Constructor
   */
  constructor() {
    this._textures = new csmVector<TextureInfo>();
  }

  /**
   * Release.
   */
  public release(): void {
    for (
      let ite: iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      gl.deleteTexture(ite.ptr().id);
    }
    this._textures = null;
  }

  /**
   * Load image
   *
   * @param fileName Path name of the image to load
   * @param usePremultiply Enable Premult processing
   * @return Image information, null if loading fails
   */
  public createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean,
    callback: (textureInfo: TextureInfo) => void
  ): void {
    // search loaded texture already
    for (
      let ite: iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      if (
        ite.ptr().fileName == fileName &&
        ite.ptr().usePremultply == usePremultiply
      ) {
        // For subsequent loads, cache is used (no waiting time)
        // WebKit requires re-instantiation to call onload of the same Image again
        // Details: https://stackoverflow.com/a/5024181
        ite.ptr().img = new Image();
        ite
          .ptr()
          .img.addEventListener("load", (): void => callback(ite.ptr()), {
            passive: true,
          });
        ite.ptr().img.src = fileName;
        return;
      }
    }

    // Trigger on data load
    const img = new Image();
    img.addEventListener(
      "load",
      (): void => {
        // Create texture object
        const tex: WebGLTexture = gl.createTexture();

        // Select texture
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Write pixels to texture
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Enable Premult processing
        if (usePremultiply) {
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        }

        // Write pixels to texture
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );

        // Generate mipmap
        gl.generateMipmap(gl.TEXTURE_2D);

        // Bind texture
        gl.bindTexture(gl.TEXTURE_2D, null);

        const textureInfo: TextureInfo = new TextureInfo();
        if (textureInfo != null) {
          textureInfo.fileName = fileName;
          textureInfo.width = img.width;
          textureInfo.height = img.height;
          textureInfo.id = tex;
          textureInfo.img = img;
          textureInfo.usePremultply = usePremultiply;
          this._textures.pushBack(textureInfo);
        }

        callback(textureInfo);
      },
      { passive: true }
    );
    img.src = fileName;
  }

  /**
   * Release image
   *
   * Release all images in the array.
   */
  public releaseTextures(): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      this._textures.set(i, null);
    }

    this._textures.clear();
  }

  /**
   * Release image
   *
   * Release the image of the specified texture.
   * @param texture Texture to release
   */
  public releaseTextureByTexture(texture: WebGLTexture): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).id != texture) {
        continue;
      }

      this._textures.set(i, null);
      this._textures.remove(i);
      break;
    }
  }

  /**
   * Release image
   *
   * Release the image of the specified name.
   * @param fileName Path name of the image to release
   */
  public releaseTextureByFilePath(fileName: string): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).fileName == fileName) {
        this._textures.set(i, null);
        this._textures.remove(i);
        break;
      }
    }
  }

  _textures: csmVector<TextureInfo>;
}

/**
 * Image information structure
 */
export class TextureInfo {
  img: HTMLImageElement; // Image
  id: WebGLTexture = null; // Texture
  width = 0; // Width
  height = 0; // Height
  usePremultply: boolean; // Enable Premult processing
  fileName: string; // File name
}
