import { DisplayChannel, MainChannel } from '@rasmusln/node-spice-client';
import { SPICE_CHANNEL } from '@rasmusln/node-spice-common/common.js';
import { getConsoleJSONLogger } from '@rasmusln/node-spice-common/logger';
import express from 'express';
import { WebSocketServer } from 'ws';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
app.use(express.static('./client'));
const srv = app.listen(8080);

const wss = new WebSocketServer({
  noServer: true,
});

async function connectDisplayChannel(mainChannel) {
  let displayChannel;

  mainChannel.onChannelsList(async (mainChannelsList) => {
    for (let channel of mainChannelsList.channels) {
      if (channel.type == SPICE_CHANNEL.INPUTS && displayChannel === undefined) {
        displayChannel = new DisplayChannel(mainChannel);
        await displayChannel.connect();
        return displayChannel;
      }
    }
  });
}

wss.on('connection', async (ws) => {
  console.log('WS: connection');

  let mainChannel;
  let displayChannel;

  mainChannel = new MainChannel(
    5930,
    new Uint8Array([]),
    getConsoleJSONLogger()
  );

  displayChannel = await connectDisplayChannel(mainChannel);
  if (displayChannel !== undefined) {
    displayChannel.onMode((mode) => {

    });
  }

  ws.on('message', (msg) => {
    let payload = JSON.parse(msg);

    if (displayChannel !== undefined) {



    }

    console.log(JSON.stringify(payload));
  });

  ws.on('close', async () => {
    displayChannel.close();
    mainChannel.close();
    displayChannel = undefined;
    mainChannel = undefined;
  });

  await mainChannel.connect();
});

srv.on('upgrade', async (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
