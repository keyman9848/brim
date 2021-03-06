/* @flow */

import fs from "fs"
import readline from "readline"

const PCAP_1_HEX = "d4c3b2a1"
const PCAP_2_HEX = "a1b2c3d4"
const PCAPNG_HEX = "0a0d0d0a"
const PCAP_HEXES = [PCAP_1_HEX, PCAP_2_HEX, PCAPNG_HEX]

type IngestableType = "pcap" | "zeek" | "unknown"

export default async function fileType(path: string): Promise<IngestableType> {
  if (await isPcap(path)) {
    return "pcap"
  } else if ((await isZeekAscii(path)) || (await isZeekJson(path))) {
    return "zeek"
  } else {
    return "unknown"
  }
}

async function isZeekJson(file) {
  for await (let line of firstLines(file, 4)) {
    if (!isJson(line)) return false
  }
  return true
}

async function isZeekAscii(file) {
  for await (let line of firstLines(file, 1)) {
    if (!isZeekHeader(line)) return false
  }
  return true
}

async function isPcap(file) {
  let bytes = await firstBytes(file, 4)
  for (let hex of PCAP_HEXES) {
    if (bytes instanceof Buffer && bytes.equals(Buffer.from(hex, "hex")))
      return true
  }
  return false
}

function isZeekHeader(line) {
  return /^#separator \S+/.test(line)
}

function isJson(line) {
  try {
    JSON.parse(line)
    return true
  } catch {
    return false
  }
}

function firstBytes(file, n) {
  return new Promise((res, rej) => {
    let stream = fs.createReadStream(file, {start: 0, end: n - 1})
    stream
      .on("readable", () => {
        let buffer = stream.read(n)
        stream.close()
        res(buffer)
      })
      .on("error", rej)
  })
}

async function* firstLines(file, n) {
  let i = 0
  let input = fs.createReadStream(file, "utf-8")
  let rl = readline.createInterface({input})

  // $FlowFixMe I think we need to upgrade flow to use the asyncIterator
  for await (let line of rl) {
    yield line
    i++
    if (i === n) return
  }
}
