import express from 'express';
import { WebSocketServer } from 'ws';
import {
  SPICE_CHANNEL,
  MainChannel,
  InputsChannel,
  InputsKeyDown,
  InputsKeyUp,
  browserKeyCodeToPCATKeyCode,
  Browser,
  getConsoleJSONLogger,
} from '../../dist/cjs/index.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();
app.use(express.static('./client'));
const srv = app.listen(8080);

const wss = new WebSocketServer({
  noServer: true,
});

async function connectInputsChannel(mainChannel, callback) {
  let inputsChannel;

  mainChannel.onChannelsList(async (mainChannelsList) => {
    for (let channel of mainChannelsList.channels) {
      if (channel.type == SPICE_CHANNEL.INPUTS && inputsChannel === undefined) {
        inputsChannel = new InputsChannel(mainChannel);
        inputsChannel.onInit((_) => {
          callback(inputsChannel);
        });
        await inputsChannel.connect();
      }
    }
  });
}

wss.on('connection', async (ws) => {
  console.log('WS: connection');

  let mainChannel;
  let inputsChannel;

  mainChannel = new MainChannel(
    5930,
    new Uint8Array([]),
    getConsoleJSONLogger()
  );

  inputsChannel = await connectInputsChannel(mainChannel, (ic) => {
    inputsChannel = ic;
  });

  ws.on('message', (msg) => {
    let payload = JSON.parse(msg);

    let code = browserKeyCodeToPCATKeyCode(Browser['Firefox'], payload.code);

    if (inputsChannel !== undefined) {
      if (payload.type === 'keydown') {
        inputsChannel.send(new InputsKeyDown(code));
      } else if (payload.type === 'keyup') {
        inputsChannel.send(new InputsKeyUp(code));
      }
    }
  });

  ws.on('close', async () => {
    inputsChannel.close();
    mainChannel.close();
    inputsChannel = undefined;
    mainChannel = undefined;
  });

  await mainChannel.connect();
});

srv.on('upgrade', async (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
