import { constants, createPublicKey, publicEncrypt } from 'crypto';
import { createConnection, Socket } from 'net';
import { EventEmitter } from 'stream';
import { SPICE_MOUSE_BUTTON, SPICE_MOUSE_BUTTON_MASK } from './common';

export function encrypt_ticket(key: Buffer, ticket: Buffer): Buffer {
  const publicKey = createPublicKey({
    key: key,
    format: 'der',
    type: 'spki',
  });

  return publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1',
    },
    ticket
  );
}

export interface Reader {
  read(n: number, skip: number): Promise<ArrayBuffer>;
}

class ReaderPromise {
  public resolve: (Buffer) => void;
  public reject: (any) => void;

  constructor(public n: number, public skip: number) {}
}

/**
 * A buffered connection that supports async reads.
 *
 * Note, only a single async reader at a time. If another read is invoked then
 * the existing read promise is rejected.
 */
export class BufferedConnection implements Reader {
  private client?: Socket;
  private buffer: Buffer;

  private readerPromise?: ReaderPromise;

  private _connected: boolean;

  private eventEmitter: EventEmitter;

  get connected() {
    return this._connected;
  }

  constructor(public port: number, public logger?: Logger) {
    this.buffer = Buffer.alloc(0);
    this._connected = false;
    this.eventEmitter = new EventEmitter();
  }

  private shiftBytes(n: number, skip: number = 0): ArrayBuffer {
    const head = this.buffer.buffer.slice(
      this.buffer.byteOffset + skip,
      this.buffer.byteOffset + n
    );

    this.buffer = this.buffer.subarray(n);

    return head;
  }

  private dataListener(buffer: Buffer) {
    if (this.logger !== undefined) {
      this.logger({
        buffer: buffer,
      });
    }

    this.buffer = Buffer.concat([this.buffer, buffer]);

    if (this.readerPromise && this.readerPromise.n <= this.buffer.byteLength) {
      this.readerPromise.resolve(
        this.shiftBytes(this.readerPromise.n, this.readerPromise.skip)
      );
    }
  }

  close() {
    this.client?.end();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const options = { port: this.port };

      const client = createConnection(options, () => {
        this._connected = true;
        resolve(client);
      });

      client.on('data', (buffer) => this.dataListener(buffer));

      client.on('error', (error) => {
        if (this.logger !== undefined) {
          this.logger({
            msg: error,
          });
        }

        // if error is called before connect then establishment of connection failed
        if (!this.connected) {
          reject(error);
        } else {
          this.emitError(error);
        }
      });

      client.on('close', (hadError) => {
        this._connected = false;

        if (this.logger !== undefined) {
          this.logger({
            msg: `close - hadError ${hadError.toString()}`,
          });
        }

        if (this.readerPromise) {
          this.readerPromise.reject(new Error('Connection closed'));
        }

        this.emitClose(hadError);
      });

      client.on('end', () => {
        this._connected = false;

        if (this.logger !== undefined) {
          this.logger({
            msg: 'end',
          });
        }

        this.emitEnd();
      });

      this.client = client;
    });
  }

  read(n: number, skip: number = 0): Promise<ArrayBuffer> {
    if (this.readerPromise !== undefined) {
      this.readerPromise.reject(new Error('Other reader took precedence'));
      this.readerPromise = undefined;
    }

    if (n + skip <= this.buffer.byteLength) {
      return Promise.resolve(this.shiftBytes(n, skip));
    } else {
      const readerPromise = new ReaderPromise(n, skip);

      const p = new Promise<Buffer>((resolve, reject) => {
        readerPromise.resolve = resolve;
        readerPromise.reject = reject;
      });

      this.readerPromise = readerPromise;

      return p;
    }
  }

  write(buffer: Buffer | Uint8Array) {
    this.client?.write(buffer);
  }

  private emitError(err: Error) {
    this.eventEmitter.emit('error', err);
  }

  onError(listener: (Error) => void) {
    this.eventEmitter.on('error', listener);
  }

  private emitClose(hadError: boolean) {
    this.eventEmitter.emit('close', hadError);
  }

  onClose(listener: (boolean) => void) {
    this.eventEmitter.on('close', listener);
  }

  private emitEnd() {
    this.eventEmitter.emit('end');
  }

  onEnd(listener: () => void) {
    this.eventEmitter.on('end', listener);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Logger = (message?: any) => void;

export function getConsoleJSONLogger(): Logger {
  BigInt.prototype['toJSON'] = function (this: bigint): string {
    return this.toString();
  };

  return (message) => {
    console.log(message);
  };
}

/**
 * ButtonsState type which represent the combination of buttons mask.
 */
export type ButtonsState = number;

/**
 * Initial ButtonsState.
 */
export const ButtonsStateEmpty: ButtonsState = 0;

/**
 * Sets the button mask and returns the new ButtonsState.
 * @param buttonsState the state to change.
 * @param mask the button mask to set.
 * @returns the new state after setting the mask.
 */
export function mouseButtonsStateSet(buttonsState: ButtonsState, mask: SPICE_MOUSE_BUTTON_MASK): ButtonsState {
  return buttonsState |= mask;
}

/**
 * Unsets the button mask and returns the new ButtonsState.
 * @param buttonsState the state to change.
 * @param mask the button mask to unset.
 * @returns the new state after unsetting the mask.
 */
export function mouseButtonsStateUnset(buttonsState: ButtonsState, mask: SPICE_MOUSE_BUTTON_MASK) : ButtonsState {
  return buttonsState &= ~mask;
}

/**
 * Converts the browser mouse button to the corresponding spice mouse button.
 * @param browserButton browser mouse button.
 * @returns the corresponding SPICE_MOUSE_BUTTON.
 */
export function browserMouseButtonToSpiceMouseButton(browserButton: number): SPICE_MOUSE_BUTTON | null {
  switch (browserButton) {
    case 0:
      return SPICE_MOUSE_BUTTON.LEFT;
    case 1:
      return SPICE_MOUSE_BUTTON.MIDDLE;
    case 2:
      return SPICE_MOUSE_BUTTON.RIGHT;
      default:
        return null;
      }
    }
    
//TODO mouse wheel 
// case :
//   return SPICE_MOUSE_BUTTON.UP;
// case :
//   return SPICE_MOUSE_BUTTON.DOWN

/**
 * Converts the browser mouse button to the corresponding spice mouse button mask.
 * @param browserButton browser mouse button.
 * @returns the corresponding SPICE_MOUSE_BUTTON_MASK.
 */
export function browserMouseButtonToSpiceMouseButtonMask(browserButton: number): SPICE_MOUSE_BUTTON_MASK | null {
  switch (browserButton) {
    case 0:
      return SPICE_MOUSE_BUTTON_MASK.LEFT;
    case 1:
      return SPICE_MOUSE_BUTTON_MASK.MIDDLE;
    case 2:
      return SPICE_MOUSE_BUTTON_MASK.RIGHT;
    default:
      return null;
  }
}

// Set 1
export enum ATPCKeyCode {
  KEY_ESC = 0x01,
  KEY_1 = 0x02,
  KEY_2 = 0x03,
  KEY_3 = 0x04,
  KEY_4 = 0x05,
  KEY_5 = 0x06,
  KEY_6 = 0x07,
  KEY_7 = 0x08,
  KEY_8 = 0x09,
  KEY_9 = 0x0a,
  KEY_0 = 0x0b,
  KEY_MINUS = 0x0c,
  KEY_EQUAL = 0x0d,
  KEY_BACKSPACE = 0x0e,
  KEY_TAB = 0x0f,
  KEY_Q = 0x10,
  KEY_W = 0x11,
  KEY_E = 0x12,
  KEY_R = 0x13,
  KEY_T = 0x14,
  KEY_Y = 0x16,
  KEY_U = 0x16,
  KEY_I = 0x17,
  KEY_O = 0x18,
  KEY_P = 0x19,
  KEY_LEFTBRACE = 0x0a,
  KEY_RIGHTBRACE = 0x1b,
  KEY_ENTER = 0x1c,
  KEY_LEFTCTRL = 0x1d,
  KEY_A = 0x1e,
  KEY_S = 0x1f,
  KEY_D = 0x20,
  KEY_F = 0x21,
  KEY_G = 0x22,
  KEY_H = 0x23,
  KEY_J = 0x24,
  KEY_K = 0x25,
  KEY_L = 0x26,
  KEY_SEMICOLON = 0x27,
  KEY_APOSTROPHE = 0x28,
  KEY_GRAVE = 0x29,
  KEY_LEFTSHIFT = 0x2a,
  KEY_BACKSLASH = 0x2b,
  KEY_Z = 0x2c,
  KEY_X = 0x2d,
  KEY_C = 0x2e,
  KEY_V = 0x2f,
  KEY_B = 0x30,
  KEY_N = 0x31,
  KEY_M = 0x32,
  KEY_COMMA = 0x33,
  KEY_DOT = 0x34,
  KEY_SLASH = 0x35,
  KEY_RIGHTSHIFT = 0x36,
  KEY_KPASTERISK = 0x37,
  KEY_LEFTALT = 0x38,
  KEY_SPACE = 0x39,
  KEY_CAPSLOCK = 0x3a,
  KEY_F1 = 0x3b,
  KEY_F2 = 0x3c,
  KEY_F3 = 0x3d,
  KEY_F4 = 0x3e,
  KEY_F5 = 0x3f,
  KEY_F6 = 0x40,
  KEY_F7 = 0x41,
  KEY_F8 = 0x42,
  KEY_F9 = 0x43,
  KEY_F10 = 0x44,
  KEY_NUMLOCK = 0x45,
  KEY_SCROLLLOCK = 0x46,
  KEY_KP7 = 0x47,
  KEY_KP8 = 0x48,
  KEY_KP9 = 0x49,
  KEY_KPMINUS = 0x4a,
  KEY_KP4 = 0x4b,
  KEY_KP5 = 0x4c,
  KEY_KP6 = 0x4d,
  KEY_KPPLUS = 0x4e,
  KEY_KP1 = 0x4f,
  KEY_KP2 = 0x50,
  KEY_KP3 = 0x51,
  KEY_KP0 = 0x52,
  KEY_KPDOT = 0x53,
  KEY_ALT = 0x54,

  KEY_F11 = 0x57,
  KEY_F12 = 0x58,
}

export enum Browser {
  Firefox,
  Chromium,
}

export enum BrowserKeyCodeType {
  Windows,
  Mac,
  LinuxX11,
}

const windowsFirefoxKeyCodeMap: { [code: string]: ATPCKeyCode } = {
  Escape: ATPCKeyCode.KEY_ESC,
  Digit1: ATPCKeyCode.KEY_1,
  Digit2: ATPCKeyCode.KEY_2,
  Digit3: ATPCKeyCode.KEY_3,
  Digit4: ATPCKeyCode.KEY_4,
  Digit5: ATPCKeyCode.KEY_5,
  Digit6: ATPCKeyCode.KEY_6,
  Digit7: ATPCKeyCode.KEY_7,
  Digit8: ATPCKeyCode.KEY_8,
  Digit9: ATPCKeyCode.KEY_9,
  Digit0: ATPCKeyCode.KEY_0,
  Minus: ATPCKeyCode.KEY_MINUS,
  Equal: ATPCKeyCode.KEY_EQUAL,
  Backspace: ATPCKeyCode.KEY_BACKSPACE,
  Tab: ATPCKeyCode.KEY_TAB,
  KeyQ: ATPCKeyCode.KEY_Q,
  KeyE: ATPCKeyCode.KEY_E,
  KeyR: ATPCKeyCode.KEY_R,
  KeyT: ATPCKeyCode.KEY_T,
  KeyY: ATPCKeyCode.KEY_Y,
  KeyU: ATPCKeyCode.KEY_U,
  KeyI: ATPCKeyCode.KEY_I,
  KeyO: ATPCKeyCode.KEY_O,
  KeyP: ATPCKeyCode.KEY_P,
  BracketLeft: ATPCKeyCode.KEY_LEFTBRACE,
  BracketRight: ATPCKeyCode.KEY_RIGHTBRACE,
  Enter: ATPCKeyCode.KEY_ENTER,
  ControlLeft: ATPCKeyCode.KEY_LEFTCTRL,
  KeyA: ATPCKeyCode.KEY_A,
  KeyS: ATPCKeyCode.KEY_S,
  KeyD: ATPCKeyCode.KEY_D,
  KeyF: ATPCKeyCode.KEY_F,
  KeyG: ATPCKeyCode.KEY_G,
  KeyH: ATPCKeyCode.KEY_H,
  KeyJ: ATPCKeyCode.KEY_J,
  KeyK: ATPCKeyCode.KEY_K,
  KeyL: ATPCKeyCode.KEY_L,
  Semicolon: ATPCKeyCode.KEY_SEMICOLON,
  Quote: ATPCKeyCode.KEY_APOSTROPHE,
  ShiftLeft: ATPCKeyCode.KEY_LEFTSHIFT,
  BackSlash: ATPCKeyCode.KEY_BACKSLASH,
  KeyZ: ATPCKeyCode.KEY_Z,
  KeyX: ATPCKeyCode.KEY_X,
  KeyC: ATPCKeyCode.KEY_C,
  KeyV: ATPCKeyCode.KEY_V,
  KeyB: ATPCKeyCode.KEY_B,
  KeyN: ATPCKeyCode.KEY_N,
  KeyM: ATPCKeyCode.KEY_M,
  Comma: ATPCKeyCode.KEY_COMMA,
  Period: ATPCKeyCode.KEY_DOT,
  Slash: ATPCKeyCode.KEY_SLASH,
  ShiftRight: ATPCKeyCode.KEY_RIGHTSHIFT,
  NumpadMultiply: ATPCKeyCode.KEY_KPASTERISK,
  AltLeft: ATPCKeyCode.KEY_LEFTALT,
  Space: ATPCKeyCode.KEY_SPACE,
  CapsLock: ATPCKeyCode.KEY_CAPSLOCK,
  F1: ATPCKeyCode.KEY_F1,
  F2: ATPCKeyCode.KEY_F2,
  F3: ATPCKeyCode.KEY_F3,
  F4: ATPCKeyCode.KEY_F4,
  F5: ATPCKeyCode.KEY_F5,
  F6: ATPCKeyCode.KEY_F6,
  F7: ATPCKeyCode.KEY_F7,
  F8: ATPCKeyCode.KEY_F8,
  F9: ATPCKeyCode.KEY_F9,
  F10: ATPCKeyCode.KEY_F10,
  ScrollLock: ATPCKeyCode.KEY_SCROLLLOCK,
  Numpad7: ATPCKeyCode.KEY_KP7,
  Numpad8: ATPCKeyCode.KEY_KP8,
  Numpad9: ATPCKeyCode.KEY_KP9,
  NumpadSubstract: ATPCKeyCode.KEY_KPMINUS,
  Numpad4: ATPCKeyCode.KEY_KP4,
  Numpad5: ATPCKeyCode.KEY_KP5,
  Numpad6: ATPCKeyCode.KEY_KP6,
  NumpadAdd: ATPCKeyCode.KEY_KPPLUS,
  Numpad1: ATPCKeyCode.KEY_KP1,
  Numpad2: ATPCKeyCode.KEY_KP2,
  Numpad3: ATPCKeyCode.KEY_KP3,
  Numpad0: ATPCKeyCode.KEY_KP0,
  NumpadDecimal: ATPCKeyCode.KEY_KPDOT,
  F11: ATPCKeyCode.KEY_F11,
  F12: ATPCKeyCode.KEY_F12,
  NumLock: ATPCKeyCode.KEY_NUMLOCK,
  ArrowUp: ATPCKeyCode.KEY_KP8,
  ArrowLeft: ATPCKeyCode.KEY_KP4,
  ArrowRight: ATPCKeyCode.KEY_KP6,
  ArrowDown: ATPCKeyCode.KEY_KP2,
};

export enum MacBrowserKeyCode {}
//TODO

export enum LinuxX11BrowserKeyCode {}
//TODO

export function browserKeyCodeToPCATKeyCode(
  browser: Browser,
  code: string
): ATPCKeyCode | undefined {
  switch (browser) {
    case Browser.Firefox:
      return windowsFirefoxKeyCodeMap[code];
    default:
      throw new Error('Not implemented');
  }
}
