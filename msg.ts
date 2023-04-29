import {
  ByteSize,
  Deserializable,
  Serializable,
  SPICE_CHANNEL,
  SPICE_CHANNEL_CAP,
  SPICE_COMMON_CAP,
  SPICE_LINK_ERR,
  SPICE_MAGIC,
  SPICE_MSG,
  SPICE_MSGC,
  SPICE_MSGC_INPUTS,
  SPICE_MSGC_MAIN,
  SPICE_MSGC_TYPE,
  SPICE_MSG_INPUTS,
  SPICE_MSG_MAIN,
  SPICE_MSG_TYPE,
  SPICE_TICKET_PUBKEY_BYTES,
  SPICE_TICKET_PUBKEY_RSA_KEY_BIT_SIZE,
  SPICE_VERSION_MAJOR,
  SPICE_VERSION_MINOR,
} from './common';

export interface Msg {
  msgType: SPICE_MSG | SPICE_MSG_TYPE;
}

export interface Msgc {
  msgcType: SPICE_MSGC | SPICE_MSGC_TYPE;
}

export class SetAck implements Deserializable {
  bufferSize: number = ByteSize.Uint32 + ByteSize.Uint32;

  constructor(public generation: number, public window: number) {}

  static fromBuffer(buffer: ArrayBuffer) {
    const dv = new DataView(buffer);

    let at = 0;

    const generation = dv.getUint32(at, true);
    at += ByteSize.Uint32;
    const window = dv.getUint32(at, true);
    at += ByteSize.Uint32;

    return new SetAck(generation, window);
  }
}

export class Ping implements Msg, Deserializable {
  static fixedBufferSize = ByteSize.Uint32 + ByteSize.BigUint64;

  readonly bufferSize: number = Ping.fixedBufferSize;

  constructor(public id: number, public time: bigint) {}
  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG.PING;

  static fromBuffer(buffer: ArrayBuffer): Ping {
    const dv = new DataView(buffer);

    let at = 0;

    const id = dv.getUint32(at, true);
    at += ByteSize.Uint32;
    const time = dv.getBigUint64(at, true);
    at += ByteSize.BigUint64;

    return new Ping(id, time);
  }
}

export class Notify implements Msg, Deserializable {
  msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG.NOTIFY;
  bufferSize: number;

  get messageUtf8(): string {
    return new TextDecoder().decode(this.message);
  }

  constructor(
    public timeStamp: bigint,
    public severity: number,
    public visibility: number,
    public what: number,
    public messageLen: number,
    public message: Uint8Array
  ) {}

  static fromBuffer(buffer: ArrayBuffer): Notify {
    const dv = new DataView(buffer);

    let at = 0;

    const timeStamp = dv.getBigUint64(at, true);
    at += ByteSize.BigUint64;
    const severity = dv.getUint32(at, true);
    at += ByteSize.Uint32;
    const visibility = dv.getUint32(at, true);
    at += ByteSize.Uint32;
    const what = dv.getUint32(at, true);
    at += ByteSize.Uint32;
    const messageLen = dv.getUint32(at, true);
    at += ByteSize.Uint32;
    const message = buffer.slice(at, at + messageLen);
    at += messageLen * ByteSize.Uint8;

    return new Notify(
      timeStamp,
      severity,
      visibility,
      what,
      messageLen,
      new Uint8Array(message)
    );
  }
}

export class MainInit implements Msg, Deserializable {
  static fixedBufferSize: number = ByteSize.Uint32 * 8;
  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG_MAIN.INIT;

  readonly bufferSize = MainInit.fixedBufferSize;

  constructor(
    public session_id: number,
    public display_channels_hint: number,
    public supported_mouse_modes: number,
    public current_mouse_mode: number,
    public agent_connected: number,
    public agent_tokens: number,
    public multi_media_time: number,
    public ram_hint: number
  ) {}

  static fromBuffer(buffer: ArrayBuffer): MainInit {
    const dv = new DataView(buffer);

    let at = 0;

    const session_id = dv.getUint32(at, true);
    at += 4;
    const display_channels_hint = dv.getUint32(at, true);
    at += 4;
    const supported_mouse_modes = dv.getUint32(at, true);
    at += 4;
    const current_mouse_mode = dv.getUint32(at, true);
    at += 4;
    const agent_connected = dv.getUint32(at, true);
    at += 4;
    const agent_tokens = dv.getUint32(at, true);
    at += 4;
    const multi_media_time = dv.getUint32(at, true);
    at += 4;
    const ram_hint = dv.getUint32(at, true);
    at += 4;

    return new MainInit(
      session_id,
      display_channels_hint,
      supported_mouse_modes,
      current_mouse_mode,
      agent_connected,
      agent_tokens,
      multi_media_time,
      ram_hint
    );
  }
}

export class LinkReply implements Deserializable {
  static fixedBufferSize: number =
    ByteSize.Uint32 * 8 + ByteSize.Uint8 * SPICE_TICKET_PUBKEY_BYTES;

  bufferSize: number = LinkReply.fixedBufferSize;

  constructor(
    public magic: number,
    public major_version: number,
    public minor_version: number,
    public size: number,
    public error: SPICE_LINK_ERR,
    public pub_key: Uint8Array,
    public num_common_caps: number,
    public num_channel_caps: number,
    public caps_offset: number
  ) {}

  get get_buf_key_slice(): ArrayBuffer {
    const length = this.pub_key.byteLength + this.pub_key.byteOffset;
    return this.pub_key.buffer.slice(this.pub_key.byteOffset, length);
  }

  static fromBuffer(buffer: ArrayBuffer): LinkReply {
    const dv = new DataView(buffer);
    let at = 0;

    const magic = dv.getUint32(at, true);
    at += 4;
    const major_version = dv.getUint32(at, true);
    at += 4;
    const minor_version = dv.getUint32(at, true);
    at += 4;
    const size = dv.getUint32(at, true);
    at += 4;
    const error = dv.getUint32(at, true);
    at += 4;
    const pub_key = buffer.slice(at, at + SPICE_TICKET_PUBKEY_BYTES);
    at += SPICE_TICKET_PUBKEY_BYTES;
    const num_common_caps = dv.getUint32(at, true);
    at += 4;
    const num_channel_caps = dv.getUint32(at, true);
    at += 4;
    const caps_offset = dv.getUint32(at, true);
    at += 4;

    at = 16 + caps_offset;

    return new LinkReply(
      magic,
      major_version,
      minor_version,
      size,
      error,
      new Uint8Array(pub_key),
      num_common_caps,
      num_channel_caps,
      caps_offset
    );
  }
}

export class LinkReplyData implements Deserializable {
  bufferSize: number =
    ByteSize.Uint32 * (this.common_caps.length + this.channel_caps.length);

  constructor(public common_caps: number[], public channel_caps: number[]) {}

  static fromBuffer(
    buffer: ArrayBuffer,
    num_common_caps: number,
    num_channel_caps: number
  ): LinkReplyData {
    const dv = new DataView(buffer);
    let at = 0;

    const common_caps: number[] = [];
    for (let i = 0; i < num_common_caps; i++) {
      const cap = dv.getUint32(at, true);
      at += ByteSize.Uint32;
      common_caps.push(cap);
    }

    const channel_caps: number[] = [];
    for (let i = 0; i < num_channel_caps; i++) {
      const cap = dv.getUint32(at, true);
      at += ByteSize.Uint32;
      channel_caps.push(cap);
    }

    return new LinkReplyData(common_caps, channel_caps);
  }

  static bufferSize(linkReplyHeader: LinkReply): number {
    return (
      (linkReplyHeader.num_common_caps + linkReplyHeader.num_channel_caps) *
      ByteSize.Uint32
    );
  }
}

export class AuthReply implements Deserializable {
  static fixedbufferSize: number = ByteSize.Uint32;

  bufferSize: number = AuthReply.fixedbufferSize;

  constructor(public error_code: number) {}

  static fromBuffer(buffer: ArrayBuffer): AuthReply {
    const dv = new DataView(buffer);

    const error_code = dv.getUint32(0, true);

    return new AuthReply(error_code);
  }
}

export class MainName implements Msg, Deserializable {
  get bufferSize(): number {
    return ByteSize.Uint32 + this.name.length * ByteSize.Uint8;
  }

  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG_MAIN.NAME;
  readonly name_utf8: string;

  constructor(public name_length: number, public name: Uint8Array) {
    this.name_utf8 = new TextDecoder().decode(this.name);
  }

  static fromBuffer(buffer: ArrayBuffer): MainName {
    const dv = new DataView(buffer);

    let at = 0;

    const name_length = dv.getUint32(at, true);
    at += ByteSize.Uint32;
    const name = new Uint8Array(name_length);

    for (let i = 0; i < name_length; i++) {
      name[i] = dv.getUint8(at);
      at += ByteSize.Uint8;
    }

    return new MainName(name_length, name);
  }
}

export class MainUUID implements Msg, Deserializable {
  static uuid_length = 16;
  static fixedBufferSize = this.uuid_length;

  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG_MAIN.UUID;
  readonly bufferSize: number = MainUUID.fixedBufferSize;

  uuid_utf8: string;

  constructor(public uuid: Uint8Array) {
    this.uuid_utf8 = new TextDecoder().decode(this.uuid);
  }

  static fromBuffer(buffer: ArrayBuffer): MainUUID {
    const dv = new DataView(buffer);
    let at = 0;

    const uuid = new Uint8Array(this.uuid_length);

    for (let i = 0; i < this.uuid_length; i++) {
      uuid[i] = dv.getUint8(at);
      at += ByteSize.Uint8;
    }

    return new MainUUID(uuid);
  }
}

export class MainSpiceChannelId {
  static fixedBufferSize = ByteSize.Uint8 * 2;

  readonly type: SPICE_CHANNEL;

  constructor(public typeRaw: number, public id: number) {
    this.type = typeRaw;
  }
}

export class MainChannelsList implements Msg, Deserializable {
  bufferSize: number;
  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG_MAIN.CHANNELS_LIST;

  get num_of_channels(): number {
    return this.channels.length;
  }

  constructor(public channels: MainSpiceChannelId[]) {}

  static fromBuffer(buffer: ArrayBuffer): MainChannelsList {
    const dv = new DataView(buffer);
    let at = 0;

    const num_of_channels = dv.getUint32(at, true);
    at += ByteSize.Uint32;

    const channels: MainSpiceChannelId[] = [];

    for (let i = 0; i < num_of_channels; i++) {
      const typeRaw = dv.getUint8(at);
      at += ByteSize.Uint8;
      const id = dv.getUint8(at);
      at += ByteSize.Uint8;

      channels.push(new MainSpiceChannelId(typeRaw, id));
    }

    return new MainChannelsList(channels);
  }
}

export class InputsInit implements Msg, Deserializable {
  bufferSize: number = ByteSize.Uint16;

  constructor(public keyboardLedBits: number) {}
  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG_INPUTS.INIT;

  static fromBuffer(buffer: ArrayBuffer): InputsInit {
    const dv = new DataView(buffer);

    const keyboardLedBits = dv.getUint16(0, true);

    return new InputsInit(keyboardLedBits);
  }
}

export class InputsKeyModifiers
  implements Msg, Serializable, Deserializable, Msgc
{
  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE = SPICE_MSG_INPUTS.KEY_MODIFIERS;
  readonly msgcType: number = SPICE_MSGC_INPUTS.KEY_MODIFIERS;
  bufferSize: number = ByteSize.Uint16;

  constructor(public keyModifiers: number) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    dv.setUint16(0, this.keyModifiers, true);

    return new Uint8Array(buf);
  }

  static fromBuffer(buffer: ArrayBuffer): InputsInit {
    const dv = new DataView(buffer);

    const keyboardLedBits = dv.getUint16(0, true);

    return new InputsInit(keyboardLedBits);
  }
}

export class InputsMouseMotionAck implements Msg, Deserializable {
  readonly msgType: SPICE_MSG | SPICE_MSG_TYPE =
    SPICE_MSG_INPUTS.MOUSE_MOTION_ACK;
  readonly bufferSize: number = 0;

  static fromBuffer(_buffer: ArrayBuffer): InputsMouseMotionAck {
    return new InputsMouseMotionAck();
  }
}

export class AckSync {}

export class Ack {}

export class Pong implements Serializable, Msgc {
  bufferSize: number = ByteSize.Uint32 + ByteSize.BigUint64;

  constructor(public id: number, public time: bigint) {}

  msgcType: number = SPICE_MSGC.PONG;

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint32(at, this.id, true);
    at += ByteSize.Uint32;
    dv.setBigUint64(at, this.time, true);
    at += ByteSize.BigUint64;

    return new Uint8Array(buf);
  }
}

export class LinkMess<T extends SPICE_CHANNEL_CAP> implements Serializable {
  get bufferSize(): number {
    return ByteSize.Uint32 * 10 + ByteSize.Uint8 * 2;
  }

  constructor(
    public connection_id: number,
    public channel_type: SPICE_CHANNEL,
    public channel_id: number,
    public common_caps: SPICE_COMMON_CAP[],
    public channel_caps: T[]
  ) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint32(at, SPICE_MAGIC, true);
    at += 4;
    dv.setUint32(at, SPICE_VERSION_MAJOR, true);
    at += 4;
    dv.setUint32(at, SPICE_VERSION_MINOR, true);
    at += 4;
    dv.setUint32(at, 18 + 4 + 4, true);
    at += 4;
    dv.setUint32(at, this.connection_id, true);
    at += 4;
    dv.setUint8(at, this.channel_type);
    at += 1;
    dv.setUint8(at, this.channel_id);
    at += 1;
    dv.setUint32(at, 1, true);
    at += 4;
    dv.setUint32(at, 1, true);
    at += 4;
    dv.setUint32(at, 18, true);
    at += 4;

    let common_cap = 0;
    for (let i = 0; i < this.common_caps.length; i++) {
      common_cap |= 1 << this.common_caps[i];
    }
    dv.setUint32(at, common_cap, true);
    at += ByteSize.Uint32;

    let channel_cap = 0;
    for (let i = 0; i < this.channel_caps.length; i++) {
      channel_cap |= 1 << this.channel_caps[i];
    }
    dv.setUint32(at, channel_cap, true);
    at += ByteSize.Uint32;

    return new Uint8Array(buf);
  }
}

export class AuthTicket implements Serializable {
  bufferSize: number =
    ByteSize.Uint32 +
    (ByteSize.Uint8 * SPICE_TICKET_PUBKEY_RSA_KEY_BIT_SIZE) / 8;

  constructor(public auth_method: number, public encrypted_data?: Uint8Array) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint32(at, this.auth_method, true);
    at += ByteSize.Uint32;

    for (let i = 0; i < SPICE_TICKET_PUBKEY_RSA_KEY_BIT_SIZE / 8; i++) {
      if (this.encrypted_data && i < this.encrypted_data.length) {
        dv.setUint8(at, this.encrypted_data[i]);
      } else {
        dv.setUint8(at, 0);
      }

      at += ByteSize.Uint8;
    }

    return new Uint8Array(buf);
  }
}

export class MainAgentToken implements Serializable {
  bufferSize: number;

  toBuffer(): Uint8Array {
    throw new Error('Method not implemented.');
  }
}

export class MainAttachChannels implements Serializable, Msgc {
  bufferSize: number = 0;
  msgcType: number = SPICE_MSGC_MAIN.ATTACH_CHANNELS;

  toBuffer(): Uint8Array {
    return new Uint8Array();
  }
}

export class MainAgentStart implements Serializable, Msgc {
  bufferSize: number = ByteSize.Uint32;
  msgcType: number = SPICE_MSGC_MAIN.AGENT_START;

  constructor(public tokens: number) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    dv.setUint32(0, this.tokens, true);

    return new Uint8Array(buf);
  }
}

abstract class InputsKey implements Serializable, Msgc {
  abstract msgcType: number;
  bufferSize: number = 4 * ByteSize.Uint8;

  constructor(public keyCode: number) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    dv.setUint32(0, this.keyCode, true);

    return new Uint8Array(buf);
  }
}

export class InputsKeyDown extends InputsKey implements Serializable, Msgc {
  msgcType: number = SPICE_MSGC_INPUTS.KEY_DOWN;
}

export class InputsKeyUp extends InputsKey implements Serializable, Msgc {
  msgcType: number = SPICE_MSGC_INPUTS.KEY_UP;
}

export class InputsMouseMotion implements Serializable, Deserializable {
  bufferSize: number = ByteSize.Int32 + ByteSize.Int32 + ByteSize.Uint32;

  constructor(
    public dx: number,
    public dy: number,
    public buttonsState: number
  ) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    let at = 0;

    dv.setInt32(at, this.dx, true);
    at += ByteSize.Int32;
    dv.setInt32(at, this.dy, true);
    at += ByteSize.Int32;
    dv.setUint32(at, this.buttonsState);
    at += ByteSize.Uint32;

    return new Uint8Array(buf);
  }

  static fromBuffer(buffer: ArrayBuffer): InputsMouseMotion {
    const dv = new DataView(buffer);
    let at = 0;

    const dx = dv.getInt32(at, true);
    at += ByteSize.Int32;
    const dy = dv.getInt32(at, true);
    at += ByteSize.Int32;
    const buttonsState = dv.getUint32(at, true);
    at += ByteSize.Uint32;

    return new InputsMouseMotion(dx, dy, buttonsState);
  }
}

export class InputsMousePosition implements Serializable {
  bufferSize: number = 3 * ByteSize.Uint32 + ByteSize.Uint8;

  constructor(
    public x: number,
    public y: number,
    public buttonsState: number,
    public displayId: number
  ) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint32(at, this.x, true);
    at += ByteSize.Uint32;
    dv.setUint32(at, this.y, true);
    at += ByteSize.Uint32;
    dv.setUint32(at, this.buttonsState, true);
    at += ByteSize.Uint32;
    dv.setUint8(at, this.displayId);
    at += ByteSize.Uint8;

    return new Uint8Array(buf);
  }
}

class InputsMouse implements Serializable {
  bufferSize: number = ByteSize.Uint32 + ByteSize.Uint32;

  constructor(
    public button: number,
    public buttons_state: number
  ) {}

  toBuffer(): Uint8Array {
    const buf = new ArrayBuffer(this.bufferSize);
    const dv = new DataView(buf);

    let at = 0;

    dv.setUint32(at, this.button, true);
    at += ByteSize.Uint32;
    dv.setUint32(at, this.buttons_state, true);
    at += ByteSize.Uint32;

    return new Uint8Array(buf);
  }
}

export class InputsMousePress extends InputsMouse implements Serializable, Msgc {
  msgcType: number = SPICE_MSGC_INPUTS.MOUSE_PRESS;
}

export class InputsMouseRelease extends InputsMouse implements Serializable, Msgc {
  msgcType: number = SPICE_MSGC_INPUTS.MOUSE_RELEASE;
}


