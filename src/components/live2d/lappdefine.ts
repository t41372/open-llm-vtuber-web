/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LogLevel } from '../../Framework/src/live2dcubismframework';

/**
 * Constants used in Sample App
 */

// Canvas width and height pixel values, or dynamic screen size ('auto').
export const CanvasSize: { width: number; height: number } | 'auto' = 'auto';

// Screen
export const ViewScale = 1.0;
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;
export const ViewLogicalBottom = -1.0;
export const ViewLogicalTop = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// Relative path
export const ResourcesPath = '../../Resources/';

// Background image file behind the model
export const BackImageName = "bg/ceiling-window-room-night.jpeg";

// Gear icon
export const GearImageName = 'icon_gear.png';

// Exit button
export const PowerImageName = 'CloseNormal.png';

// Model definition---------------------------------------------
// Array of directory names where models are placed
// Make sure directory names match model3.json names
export const ModelDir: string[] = [
  'Haru',
  'Hiyori',
  'Mark',
  'Natori',
  'Rice',
  'Mao',
  'Wanko'
];
export const ModelDirSize: number = ModelDir.length;

// Match with external definition file (json)
export const MotionGroupIdle = 'Idle'; // Idling
export const MotionGroupTapBody = 'TapBody'; // When tapping the body

// Match with external definition file (json)
export const HitAreaNameHead = 'Head';
export const HitAreaNameBody = 'Body';

// Motion priority constants
export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

// MOC3 consistency validation option
export const MOCConsistencyValidationEnable = true;

// Debug log display options
export const DebugLogEnable = true;
export const DebugTouchLogEnable = false;

// Log level settings output from Framework
export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;

// Default render target size
export const RenderTargetWidth = 1900;
export const RenderTargetHeight = 1000;
