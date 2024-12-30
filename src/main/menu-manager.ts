import { Tray, nativeImage, Menu, BrowserWindow, ipcMain, screen, MenuItemConstructorOptions, app } from 'electron'
import trayIcon from '../../resources/icon.png?asset'

export class MenuManager {
  private tray: Tray | null = null
  private currentMode: 'window' | 'pet' = 'window'

  constructor(private onModeChange: (mode: 'window' | 'pet') => void) {
    this.setupContextMenu()
  }

  createTray(): void {
    const icon = nativeImage.createFromPath(trayIcon)
    const trayIconResized = icon.resize({
      width: process.platform === 'win32' ? 16 : 18,
      height: process.platform === 'win32' ? 16 : 18
    })
    
    this.tray = new Tray(trayIconResized)
    this.updateTrayMenu()
  }

  private getModeMenuItems(): MenuItemConstructorOptions[] {
    // console.log('Getting mode menu items, current mode:', this.currentMode)
    return [
      {
        label: 'Window Mode',
        type: 'radio',
        checked: this.currentMode === 'window',
        click: () => {
          this.setMode('window')
        }
      },
      {
        label: 'Pet Mode',
        type: 'radio',
        checked: this.currentMode === 'pet',
        click: () => {
          this.setMode('pet')
        }
      }
    ]
  }

  private updateTrayMenu(): void {
    if (!this.tray) return
    // console.log('Updating tray menu, current mode:', this.currentMode)

    const contextMenu = Menu.buildFromTemplate([
      ...this.getModeMenuItems(),
      { type: 'separator' },
      {
        label: 'Show',
        click: () => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach(window => {
            window.show()
          })
        }
      },
      {
        label: 'Hide',
        click: () => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach(window => {
            window.hide()
          })
        }
      },
      {
        label: 'Exit',
        click: () => {
          app.quit()
        }
      }
    ])

    this.tray.setToolTip('Open LLM VTuber')
    this.tray.setContextMenu(contextMenu)
  }

  private setupContextMenu(): void {
    ipcMain.on('show-context-menu', (event, { micOn }) => {
    //   console.log('Received micOn state in main process:', micOn)
      const win = BrowserWindow.fromWebContents(event.sender)
      
      if (win) {
        const screenPoint = screen.getCursorScreenPoint()

        const template: MenuItemConstructorOptions[] = [
          {
            label: micOn ? "Turn Off Microphone" : "Turn On Microphone",
            click: () => {
              event.sender.send("mic-toggle");
            },
          },
          {
            label: "Interrupt",
            click: () => {
              event.sender.send("interrupt");
            },
          },
          { type: "separator" },
          ...this.getModeMenuItems(),
          { type: "separator" },
          {
            label: "Hide",
            click: () => {
              const windows = BrowserWindow.getAllWindows();
              windows.forEach((window) => {
                window.hide();
              });
            },
          },
          {
            label: "Exit",
            click: () => {
              app.quit();
            },
          },
        ];

        const menu = Menu.buildFromTemplate(template)
        menu.popup({
          window: win,
          x: Math.round(screenPoint.x),
          y: Math.round(screenPoint.y)
        })
      }
    })
  }

  setMode(mode: 'window' | 'pet'): void {
    // console.log('Setting mode from', this.currentMode, 'to', mode)
    this.currentMode = mode
    this.updateTrayMenu()
    this.onModeChange(mode)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
} 