/* @flow */

// $FlowFixMe
import createGlobalStore from "../state/createGlobalStore"
import globalStoreMainHandler from "./ipc/globalStore/mainHandler"
import menu from "./menu"
import windowsMainHandler from "./ipc/windows/mainHandler"
import zqdMainHandler from "./ipc/zqd/mainHandler"

console.time("init")
import "regenerator-runtime/runtime"

import {app} from "electron"

import {handleSquirrelEvent} from "./squirrel"
import {installExtensions} from "./extensions"
import tron from "./tron"
import path from "path"
import {ZQD} from "../zqd/zqd"
import electronIsDev from "./isDev"
import {setupAutoUpdater} from "./autoUpdater"
import log from "electron-log"

function setupPaths() {
  if (electronIsDev) {
    app.setPath("userData", path.join(app.getAppPath(), "userData"))
    app.setPath("logs", path.join(app.getPath("userData"), "logs"))
    log.transports.file.resolvePath = (variables) => {
      return path.join(app.getPath("logs"), variables.fileName)
    }
  }
}

async function main() {
  setupPaths()
  log.info("main, ", log.transports.file.file)
  log.info(
    "app getPath: logs",
    app.getPath("logs"),
    "appData",
    app.getPath("appData"),
    "userData",
    app.getPath("userData")
  )

  if (handleSquirrelEvent(app)) return
  let session = tron.session()
  let winMan = tron.windowManager()
  let sessionState = session.load()
  let store = createGlobalStore(
    sessionState ? sessionState.globalState : undefined
  )

  const spaceDir = path.join(app.getPath("userData"), "data", "spaces")
  const zqd = new ZQD(spaceDir)

  menu.setMenu(winMan)
  zqdMainHandler(zqd)
  windowsMainHandler(winMan)
  globalStoreMainHandler(store, winMan)

  // autoUpdater should not run in dev, and will fail if the code has not been signed
  if (!electronIsDev) {
    try {
      setupAutoUpdater()
    } catch (err) {
      console.error("Failed to initiate autoUpdater: " + err)
    }
  }

  app.on("ready", () => {
    installExtensions()
    winMan.init(sessionState)
  })

  app.on("before-quit", () => {
    winMan.isQuitting(true)
  })

  app.on("quit", () => {
    session.save(winMan.getState(), store.getState())
    zqd.close()
  })

  app.on("activate", () => {
    if (!winMan.count() === 0) winMan.init()
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin" || winMan.isQuitting()) app.quit()
  })

  app.on("web-contents-created", (event, contents) => {
    contents.on("will-attach-webview", (e) => {
      e.preventDefault()
      console.error("Security Warning: Prevented creation of webview")
    })

    contents.on("will-navigate", (e, url) => {
      if (contents.getURL() === url) return // Allow reloads
      e.preventDefault()
      console.error(`Security Warning: Prevented navigation to ${url}`)
    })

    contents.on("new-window", (e) => {
      e.preventDefault()
      console.error("Security Warning: Prevented new window from renderer")
    })
  })
}

main()
