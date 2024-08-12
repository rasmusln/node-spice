// spice magic ("REDQ" / [ 82, 69, 68, 81 ])
export const SPICE_MAGIC = 1363428690;

// spice version
export const SPICE_VERSION_MAJOR = 2;
export const SPICE_VERSION_MINOR = 2;

export enum SPICE_CHANNEL {
  MAIN = 1,
  DISPLAY = 2,
  INPUTS = 3,
  CURSOR = 4,
  PLAYBACK = 5,
  RECORD = 6,
  TUNNEL = 7,
  SMARTCARD = 8,
  USBREDIR = 9,
  PORT = 10,
  WEBDAV = 11,
}

export enum SPICE_LINK_ERR {
  OK = 0,
  ERROR = 1,
  INVALID_MAGIC = 2,
  INVALID_DATA = 3,
  VERSION_MISMATCH = 4,
  NEED_SECURED = 5,
  NEED_UNSECURED = 6,
  PERMISSION_DENIED = 7,
  BAD_CONNECTION_ID = 8,
  CHANNEL_NOT_AVAILABLE = 9,
}

export const SPICE_TICKET_PUBKEY_BYTES = 162;
export const SPICE_TICKET_PUBKEY_RSA_KEY_BIT_SIZE = 1024;

export enum SPICE_COMMON_CAP {
  PROTOCOL_AUTH_SELECTION = 0,
  AUTH_SPICE = 1,
  AUTH_SASL = 2,
  MINI_HEADER = 3,
}

export enum SPICE_AGENT {
  DISCONNECTED = 0,
  CONNECTED = 1,
}

export type SPICE_CHANNEL_CAP =
  | SPICE_MAIN_CAP
  | SPICE_NO_CAP
  | SPICE_DISPLAY_CAP;

export enum SPICE_MAIN_CAP {
  SEMI_SEAMLESS_MIGRATE = 1,
  NAME_AND_UUID = 2,
  AGENT_CONNECTED_TOKENS = 3,
  SEAMSLESS_MIGRATE = 4,
}

export enum SPICE_NO_CAP {}

export enum SPICE_DISPLAY_CAP {
  SIZED_STREAM,
  //TODO add remaining capabilities
}

export type SPICE_ADDRESS = number;

export class SPICE_FIXED28_4 {
  constructor(
    public numerator: number,
    public denominator: number,
  ) {}
}

export class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

export class Point16 {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

export class Rect {
  constructor(
    public top: number,
    public left: number,
    public bottom: number,
    public right: number,
  ) {}
}

export class PointFix {
  constructor(
    public x: SPICE_FIXED28_4,
    public y: SPICE_FIXED28_4,
  ) {}
}

export enum SPICE_LINK_MSG {
  REPLY = -1,
  RESULT = -2,
}

export enum SPICE_LINK_MSGC {
  MESS = -1,
  PASS = -2,
}

export enum SPICE_MSG {
  MIGRATE = 1,
  MIGRATE_DATA = 2,
  MSG_SET_ACK = 3,
  PING = 4,
  WAIT_FOR_CHANNELS = 5,
  DISCONNECTING = 5,
  NOTIFY = 7,
}

export enum SPICE_MSGC {
  ACK_SYNC = 1,
  ACK = 2,
  PONG = 3,
  MIGRATE_FLUSH_MARK = 4,
  MIGRATE_DATA = 5,
  DISCONNECTING = 6,
  FIRST_AVAIL = 101,
}

export type SPICE_MSG_TYPE = SPICE_MSG_MAIN | SPICE_MSG_INPUTS | SPICE_MSG_DISPLAY;

export type SPICE_MSGC_TYPE = SPICE_MSGC_MAIN | SPICE_MSGC_INPUTS | SPICE_MSGC_DISPLAY;

export enum SPICE_MSG_MAIN {
  MIGRATE_BEGIN = 101,
  MIGRATE_CANCEL = 102,
  INIT = 103,
  CHANNELS_LIST = 104,
  MOUSE_MODE = 105,
  MULTI_MEDIA_TIME = 106,
  AGENT_CONNECTED = 107,
  AGENT_DISCONNECTED = 108,
  AGENT_DATA = 109,
  AGENT_TOKEN = 110,
  MIGRATE_SWITCH_HOST = 111,
  MIGRATE_END = 112,
  NAME = 113,
  UUID = 114,
  AGENT_CONNECTED_TOKENS = 115,
  MIGRATE_BEGIN_SEAMLESS = 116,
  MIGRATE_DST_SEAMLESS_ACK = 117,
  MIGRATE_DST_SEAMLESS_NACK = 118,
}

export enum SPICE_MSGC_MAIN {
  CLIENT_INFO = 101,
  MIGRATE_CONNECTED = 102,
  MIGRATE_CONNECT_ERROR = 103,
  ATTACH_CHANNELS = 104,
  MOUSE_MODE_REQUEST = 105,
  AGENT_START = 106,
  AGENT_DATA = 107,
  AGENT_TOKEN = 108,
}

export enum SPICE_MSG_INPUTS {
  INIT = 101,
  KEY_MODIFIERS = 102,
  MOUSE_MOTION_ACK = 111,
}

export enum SPICE_MSGC_INPUTS {
  KEY_DOWN = 101,
  KEY_UP = 102,
  KEY_MODIFIERS = 103,
  MOUSE_MOTION = 111,
  MOUSE_POSITION = 112,
  MOUSE_PRESS = 113,
  MOUSE_RELEASE = 114,
}

export enum SPICE_MSG_DISPLAY {
  MODE = 101,
  MARK = 102,
  RESET = 103,
  COPY_BITS = 104,

  INVAL_LIST = 105,
  INVAL_ALL_PIXMAPS = 106,
  INVAL_PALETTE = 107,
  INVAL_ALL_PALETTES = 108,

  STREAM_CREATE = 122,
  STREAM_DATA = 123,
  STREAM_CLIP = 124,
  STREAM_DESTROY = 125,
  STREAM_DESTROY_ALL,

  DRAW_FILL = 302,
  DRAW_OPAQUE = 303,
  DRAW_COPY = 304,
  DRAW_BLEND = 305,
  DRAW_BLACKNESS = 306,
  DRAW_WHITENESS = 307,
  DRAW_INVERS = 308,
  DRAW_ROP3 = 309,
  DRAW_STROKE = 310,
  DRAW_TEXT = 311,
  DRAW_TRANSPARENT = 312,
  DRAW_ALPHA_BLEND = 313,
}

export enum SPICE_MSGC_DISPLAY {
  INIT = 101,
}

export enum SPICE_ROPD {
  INVERS_SRC = 1,
  INVERS_BRUSH = 2,
  INVERS_DEST = 4,
  OP_PUT = 8,
  OP_OR = 16,
  OP_AND = 32,
  OP_XOR = 64,
  OP_BLACKNESS = 128,
  OP_WHITENESS = 256,
  OP_INVERS = 512,
  INVERS_RES
}

export enum PIXMAP {
  FORMAT_1BIT_LE = 1,
  FORMAT_1BIT_BE = 2,
  FORMAT_4BIT_LE = 3,
  FORMAT_4BIT_BE = 4,
  FORMAT_8BIT = 5,
  FORMAT_16BIT = 6,
  FORMAT_24BIT = 7,
  FORAMT_32BIT = 8,
  FORMAT_RGBA = 9,
}

export enum PIXMAP_FLAG {
  PAL_CACHE_ME = 1,
  PAL_FROM_CACHE = 2,
  TOP_DOWN = 4,
}

export enum LZPALETTE_FLAG {
  PAL_CACHE_ME = 1,
  PAL_FROM_CACHE = 2,
  TOP_DOWN = 4,
}

export enum SPICE_IMAGE_TYPE {
  PIXMAP = 0,
  QUIC = 1,
  LZ_PLT = 100,
  LZ_RGB = 101,
  GLZ_RGB = 102,
  FROM_CACHE = 103,
}

export enum SPICE_IMAGE_FLAG {
  CACHE_ME = 1,
}

export enum SPICE_KEYBOARD_LED_BITS {
  // SPICE_SCROLL_LOCK_MODIFIER
  SCROLL_LOCK_MODIFIER = 1,
  // SPICE_NUM_LOCK_MODIFIER
  NUM_LOCK_MODIFIER = 2,
  // SPICE_CAPS_LOCK_MODIFIER
  CAPS_LOCK_MODIFIER = 4,
}

export enum SPICE_MOUSE_BUTTON {
  LEFT = 1,
  MIDDLE = 2,
  RIGHT = 3,
  UP = 4,
  DOWN = 5
}

export enum SPICE_MOUSE_BUTTON_MASK {
  LEFT = 1,
  MIDDLE = 2,
  RIGHT = 4
}

export function checkCapability(
  arr: number[],
  capability: SPICE_COMMON_CAP | SPICE_CHANNEL_CAP
): boolean {
  for (const cap of arr) {
    if (cap & (1 << capability)) {
      return true;
    }
  }

  return false;
}

export const enum ByteSize {
  Uint8 = 1,
  Int8 = 1,
  Uint16 = 2,
  Int16 = 2,
  Uint32 = 4,
  Int32 = 4,
  BigUint64 = 8,
  BigInt64 = 8,
}

export interface BufferSize {
  bufferSize: number;
}

export interface Serializable extends BufferSize {
  toBuffer(): Uint8Array;
}

export interface Deserializable {} //extends BufferSize {}

export function dataViewFromBuffer(buffer: Buffer): DataView {
  const sl = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  return new DataView(sl);
}

export class Agent {
  _tokens: number;

  get tokens() {
    return this._tokens;
  }

  constructor() {
    this._tokens = 0;
  }

  addTokens(tokens: number) {
    this._tokens += tokens;
  }

  substractTokens(tokens: number) {
    this.addTokens(-tokens);
  }
}

export interface Header {
  type: number;
  size: number;
}

export class DataHeader implements Header, Serializable, Deserializable {
  static fixedBufferSize =
    ByteSize.BigUint64 + ByteSize.Uint16 + ByteSize.Uint32 + ByteSize.Uint32;

  readonly bufferSize = DataHeader.fixedBufferSize;

  constructor(
    public serial: bigint,
    public type: number,
    public size: number,
    public sub_list: number
  ) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(18);
    const dv = new DataView(buf);

    let at = 0;

    dv.setBigUint64(at, this.serial, true);
    at += ByteSize.BigUint64;
    dv.setUint16(at, this.type, true);
    at += ByteSize.Uint16;
    dv.setUint32(at, this.size, true);
    at += ByteSize.Uint32;
    dv.setUint32(at, this.sub_list, true);
    at += ByteSize.Uint32;

    return new Uint8Array(buf);
  }

  static fromBuffer(buffer: ArrayBuffer): DataHeader {
    const dv = new DataView(buffer);

    let at = 0;

    const serial = dv.getBigUint64(at, true);
    at += 8;
    const type = dv.getUint16(at, true);
    at += 2;
    const size = dv.getUint32(at, true);
    at += 4;
    const sub_list = dv.getUint32(at, true);
    at += 4;

    return new DataHeader(serial, type, size, sub_list);
  }
}

export class MiniDataHeader implements Header, Serializable, Deserializable {
  static fixedBufferSize = ByteSize.Uint16 + ByteSize.Uint32;

  readonly bufferSize: number = MiniDataHeader.fixedBufferSize;

  constructor(public type: number, public size: number) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint16(at, this.type, true);
    at += ByteSize.Uint16;
    dv.setUint32(at, this.size, true);
    at += ByteSize.Uint32;

    return new Uint8Array(buf);
  }

  static fromBuffer(buffer: ArrayBuffer): MiniDataHeader {
    const dv = new DataView(buffer);

    let at = 0;

    const type = dv.getUint16(at, true);
    at += ByteSize.Uint16;
    const size = dv.getUint32(at, true);
    at += ByteSize.Uint32;

    return new MiniDataHeader(type, size);
  }
}

export class SubMessageList implements Serializable, Deserializable {
  get bufferSize(): number {
    return ByteSize.Uint16 + this.sub_messages.length * ByteSize.Uint32;
  }

  constructor(public size: number, public sub_messages: number[]) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(2 + this.sub_messages.length * 4);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint16(at, this.size, true);
    at += 2;

    for (let i = 0; i < this.sub_messages.length; i++) {
      dv.setUint32(at, this.sub_messages[i], true);
      at += 4;
    }

    return new Uint8Array(buf);
  }

  static fromBuffer(buffer: Buffer): SubMessageList {
    const sl = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const dv = new DataView(sl);

    let at = 0;

    const size = dv.getUint16(at, true);
    at += 2;

    const sub_list: number[] = [];
    for (let i = 0; i < size; i++) {
      sub_list[i] = dv.getUint32(at, true);
      at += 4;
    }

    return new SubMessageList(size, sub_list);
  }
}

export class SubMessage implements Serializable, Deserializable {
  bufferSize: number = ByteSize.Uint16 + ByteSize.Uint32;

  constructor(public type: number, public size: number) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(0);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint16(at, this.type, true);
    at += 2;
    dv.setUint32(at, this.size, true);
    at += 4;

    return new Uint8Array(buf);
  }

  static fromBuffer(buffer: Buffer): SubMessage {
    const sl = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const dv = new DataView(sl);

    let at = 0;

    const type = dv.getUint16(at, true);
    at += 2;
    const size = dv.getUint32(at, true);
    at += 4;

    return new SubMessage(type, size);
  }
}
