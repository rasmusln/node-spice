import { EventEmitter } from 'stream';
import {
  Agent,
  checkCapability,
  DataHeader,
  Header,
  MiniDataHeader,
  Serializable,
  SPICE_AGENT,
  SPICE_CHANNEL,
  SPICE_CHANNEL_CAP,
  SPICE_COMMON_CAP,
  SPICE_LINK_ERR,
  SPICE_MAIN_CAP,
  SPICE_MSG,
  SPICE_MSG_INPUTS,
  SPICE_MSG_MAIN,
  SPICE_MSG_TYPE,
  SPICE_NO_CAP,
} from './common';
import {
  AuthReply,
  LinkReplyData,
  LinkReply,
  MainChannelsList,
  MainInit,
  MainName,
  MainSpiceChannelId,
  MainUUID,
  Ping,
  InputsInit,
  InputsKeyModifiers,
  InputsMouseMotionAck,
  Notify,
  Msg,
  Msgc,
  LinkMess,
  AuthTicket,
  Pong,
  MainAgentStart,
  MainAttachChannels,
  InputsKeyDown,
  InputsKeyUp,
} from './msg';
import { BufferedConnection, encrypt_ticket, Logger } from './util';

export abstract class Channel<T extends SPICE_CHANNEL_CAP> {
  protected readonly conn: BufferedConnection;

  private miniHeader: boolean;

  private readonly eventEmitter: EventEmitter;

  protected readonly logger?: Logger;
  protected readonly strict: boolean;

  constructor(
    public port: number,
    public ticket: Uint8Array,
    public connection_id: number,
    public type: SPICE_CHANNEL,
    public channel_id: number,
    public commonCapabilities: SPICE_COMMON_CAP[],
    public channelCapabilities: T[],
    logger?: Logger,
    strict?: boolean
  ) {
    this.conn = new BufferedConnection(port, logger);

    this.eventEmitter = new EventEmitter();

    this.logger = logger;
    this.strict = strict !== undefined ? strict : false;
  }

  close() {
    this.conn.close();
  }

  onClose(listener: () => void) {
    this.eventEmitter.on('close', listener);
  }

  protected packMsgc(msgc: Serializable & Msgc): Uint8Array {
    if (this.miniHeader) {
      const miniDataHeader = new MiniDataHeader(msgc.msgcType, msgc.bufferSize);

      const buf = new Uint8Array(miniDataHeader.bufferSize + msgc.bufferSize);

      buf.set(miniDataHeader.toBuffer());
      buf.set(msgc.toBuffer(), miniDataHeader.bufferSize);

      return buf;
    } else {
      throw new Error('Packing non mini header not implemented');
    }
  }

  private eventKey(category: number, type: number) {
    return `Msg[${category.toString()},${type.toString()}]`;
  }

  /**
   * Helper method to construct type registrering of event listener for implementaions.
   *
   * Note, that each channel will receive general channel messages (message id < 100) and
   * channel type specific messages (message id >= 100). Therefor there should be no collision
   * of message ids.
   *
   * @param e the message time to listen for
   * @param listener listener
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  protected on(e: SPICE_MSG | SPICE_MSG_TYPE, listener: (any) => void) {
    this.eventEmitter.on(this.eventKey(this.type, e), listener);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  protected emit(v: Msg) {
    this.eventEmitter.emit(this.eventKey(this.type, v.msgType), v);
  }

  /**
   * Invoked after connection is established and header have been parsed.
   * Method is specific to the channel implementation and handles channel related message types.
   * @param header an header
   */
  abstract process(header: Header);

  protected log(...o: any[]) {
    if (this.logger !== undefined) {
      this.logger({
        timestamp: new Date(),
        connection_id: this.connection_id,
        channel: this.channel_id,
        channel_name: SPICE_CHANNEL[this.channel_id],
        payload: o,
      });
    }
  }

  protected logErr(msg: string, err?: any) {
    if (err === undefined) {
      this.log({
        msg: msg,
      });
    } else {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      this.log({
        msg: msg,
        error: err,
      });
    }
  }

  protected logMsg(msg: Msg, header?: Header) {
    if (this.logger !== undefined) {
      this.logger({
        timestamp: new Date(),
        connection_id: this.connection_id,
        channel: this.channel_id,
        channel_name: SPICE_CHANNEL[this.channel_id],
        header: header,
        msgType: msg.msgType,
        msg: msg,
      });
    }
  }

  protected logMsgc(msgc: Msgc, header?: Header) {
    if (this.logger !== undefined) {
      this.logger({
        timestamp: new Date(),
        connection_id: this.connection_id,
        channel: this.channel_id,
        channel_name: SPICE_CHANNEL[this.channel_id],
        header: header,
        msgcType: msgc.msgcType,
        msgc: msgc,
      });
    }
  }

  /**
   * Connect channel
   *
   * Note, that the method is async and returns a promise that will only return on \
   * error or on close. Otherwise, it will keep reading from the connection.
   */
  async connect() {
    await this.conn.connect();

    this.conn.onClose((hadError) => {
      this.eventEmitter.emit('close', hadError);
    });
    //TODO add remaining listeners

    const linkMess = new LinkMess(
      this.connection_id,
      this.type,
      this.channel_id,
      this.commonCapabilities,
      this.channelCapabilities
    );

    this.conn.write(linkMess.toBuffer());

    const linkReply = LinkReply.fromBuffer(
      await this.conn.read(LinkReply.fixedBufferSize)
    );
    const linkReplyData = LinkReplyData.fromBuffer(
      await this.conn.read(LinkReplyData.bufferSize(linkReply)),
      linkReply.num_common_caps,
      linkReply.num_channel_caps
    );

    this.miniHeader = checkCapability(
      linkReplyData.common_caps,
      SPICE_COMMON_CAP.MINI_HEADER
    );

    this.log(linkReplyData);

    if (linkReply.error !== SPICE_LINK_ERR.OK) {
      const msg = `Failed to connect with SPICE_LINK_ERR ${
        SPICE_LINK_ERR[linkReply.error]
      }(${linkReply.error})`;
      this.logErr(msg);
      throw new Error(msg);
    }

    const encrypted_passwoerd = encrypt_ticket(
      Buffer.from(linkReply.get_buf_key_slice),
      Buffer.from('', 'utf8')
    );

    this.conn.write(
      new AuthTicket(
        SPICE_COMMON_CAP.AUTH_SPICE,
        encrypted_passwoerd
      ).toBuffer()
    );

    const authReply = AuthReply.fromBuffer(
      await this.conn.read(AuthReply.fixedbufferSize)
    );

    this.log(authReply);

    if (authReply.error_code !== SPICE_LINK_ERR.OK) {
      this.logErr('Authentication failed');
      throw new Error('Authentication failed');
    }

    /* eslint-disable @typescript-eslint/no-floating-promises */
    (async () => {
      try {
        for (;;) {
          let header: Header;

          if (this.miniHeader) {
            const buffer = await this.conn.read(MiniDataHeader.fixedBufferSize);
            const miniDataHeader = MiniDataHeader.fromBuffer(buffer);
            header = miniDataHeader;
          } else {
            const buffer = await this.conn.read(DataHeader.fixedBufferSize);
            const dataHeader = DataHeader.fromBuffer(buffer);
            header = dataHeader;
          }

          if (header.type === 0) {
            this.logErr('Unknown header type');

            if (this.strict) {
              throw new Error('Unknown header type');
            }
          }

          switch (header.type) {
            case SPICE_MSG.PING:
              {
                const buffer = await this.conn.read(header.size);
                const ping = Ping.fromBuffer(buffer);

                this.logMsg(ping, header);

                const pong = new Pong(ping.id, ping.time);
                this.conn.write(this.packMsgc(pong));
              }
              break;
            case SPICE_MSG.NOTIFY:
              {
                const buffer = await this.conn.read(header.size);
                const notify = Notify.fromBuffer(buffer);

                this.logMsg(notify, header);

                this.emit(notify);
              }
              break;
            case SPICE_MSG.MSG_SET_ACK:
              {
                const buffer = await this.conn.read(header.size);
                const set_ack = Notify.fromBuffer(buffer);

                this.logMsg(set_ack, header);

                //TODO ack not implemented
              }
              break;
            default:
              {
                await this.process(header);
              }
              break;
          }
        }
      } catch (error) {
        this.logErr('Message processing stopped', error);
      }
    })();
  }
}

export class MainChannel extends Channel<SPICE_MAIN_CAP> {
  readonly agent: Agent;

  sessionId?: number;
  name?: string;
  uuid?: string;
  available_channels?: MainSpiceChannelId[];

  constructor(
    port: number,
    ticket: Uint8Array,
    logger?: Logger,
    ignoreUnknownMessageTypes?: boolean
  ) {
    super(
      port,
      ticket,
      0,
      SPICE_CHANNEL.MAIN,
      0,
      [
        SPICE_COMMON_CAP.PROTOCOL_AUTH_SELECTION,
        SPICE_COMMON_CAP.AUTH_SPICE,
        SPICE_COMMON_CAP.MINI_HEADER,
      ],
      [SPICE_MAIN_CAP.AGENT_CONNECTED_TOKENS, SPICE_MAIN_CAP.NAME_AND_UUID],
      logger,
      ignoreUnknownMessageTypes
    );

    this.agent = new Agent();
  }

  get isConnected() {
    return this.conn;
  }

  onInit(listener: (MainInit) => void) {
    this.on(SPICE_MSG_MAIN.INIT, listener);
  }

  onName(listener: (MainName) => void) {
    this.on(SPICE_MSG_MAIN.NAME, listener);
  }

  onUUID(listener: (MainUUID) => void) {
    this.on(SPICE_MSG_MAIN.UUID, listener);
  }

  onChannelsList(listener: (MainChannelsList) => void) {
    this.on(SPICE_MSG_MAIN.CHANNELS_LIST, listener);
  }

  async process(header: Header) {
    const buffer = await this.conn.read(header.size);

    switch (header.type) {
      case SPICE_MSG_MAIN.INIT:
        {
          const mainInit = MainInit.fromBuffer(buffer);

          this.logMsg(mainInit, header);

          this.sessionId = mainInit.session_id;

          this.agent.addTokens(mainInit.agent_tokens);

          if (mainInit.agent_connected === SPICE_AGENT.CONNECTED) {
            //TODO emit event
          }

          // start agent
          const buf1 = this.packMsgc(
            new MainAgentStart(Number.MAX_SAFE_INTEGER)
          );
          this.conn.write(buf1);

          // request channels
          const buf2 = this.packMsgc(new MainAttachChannels());
          this.conn.write(buf2);

          this.emit(mainInit);
        }
        break;
      case SPICE_MSG_MAIN.NAME:
        {
          const mainName = MainName.fromBuffer(buffer);
          this.name = mainName.name_utf8;

          this.logMsg(mainName);

          this.emit(mainName);
        }
        break;
      case SPICE_MSG_MAIN.UUID:
        {
          const mainUUID = MainUUID.fromBuffer(buffer);
          this.uuid = mainUUID.uuid_utf8;

          this.logMsg(mainUUID);

          this.emit(mainUUID);
        }
        break;
      case SPICE_MSG_MAIN.CHANNELS_LIST:
        {
          const channelsList = MainChannelsList.fromBuffer(buffer);
          this.available_channels = channelsList.channels;

          this.logMsg(channelsList);

          this.emit(channelsList);
        }
        break;
      default:
        {
          this.logErr('Unknown message type');

          if (this.strict) {
            throw new Error('Unknown message type');
          }
        }
        break;
    }
  }
}

export class InputsChannel extends Channel<SPICE_NO_CAP> {
  constructor(mainChannel: MainChannel) {
    if (mainChannel.sessionId === undefined) {
      throw new Error('Missing session id');
    }

    super(
      mainChannel.port,
      mainChannel.ticket,
      mainChannel.sessionId,
      SPICE_CHANNEL.INPUTS,
      0,
      mainChannel.commonCapabilities,
      []
    );
  }

  onInit(listener: (InputsInit) => void) {
    this.on(SPICE_MSG_INPUTS.INIT, listener);
  }

  onKeyModifiers(listener: (InputsKeyModifiers) => void) {
    this.on(SPICE_MSG_INPUTS.KEY_MODIFIERS, listener);
  }

  onMouseMotionAck(listener: (InputsMouseMotionAck) => void) {
    this.on(SPICE_MSG_INPUTS.MOUSE_MOTION_ACK, listener);
  }

  send(unpackedMsg: InputsKeyModifiers | InputsKeyDown | InputsKeyUp) {
    const buffer = this.packMsgc(unpackedMsg);
    this.logMsgc(unpackedMsg);
    this.conn.write(buffer);
  }

  async process(header: Header) {
    const buffer = await this.conn.read(header.size);

    switch (header.type) {
      case SPICE_MSG_INPUTS.INIT:
        {
          const inputsInit = InputsInit.fromBuffer(buffer);
          this.logMsg(inputsInit);
          this.emit(inputsInit);
        }
        break;
      case SPICE_MSG_INPUTS.KEY_MODIFIERS:
        {
          const inputsKeyModifiers = InputsKeyModifiers.fromBuffer(buffer);
          this.logMsg(inputsKeyModifiers);
          this.emit(inputsKeyModifiers);
        }
        break;
      case SPICE_MSG_INPUTS.MOUSE_MOTION_ACK:
        {
          const inputsMouseMotionAck = InputsMouseMotionAck.fromBuffer(buffer);
          this.logMsg(inputsMouseMotionAck);
          this.emit(inputsMouseMotionAck);
        }
        break;
      default:
        {
          this.logErr('Unknown message type');

          if (this.strict) {
            throw new Error('Unknown message type');
          }
        }
        break;
    }
  }
}
