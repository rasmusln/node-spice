import EventEmitter from "events";
import { createConnection, Socket } from "net";
import { Logger } from "node-spice-common/logger";


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