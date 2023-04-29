import express from 'express';
import { WebSocketServer } from 'ws';
import {
  SPICE_CHANNEL,
  MainChannel,
  InputsChannel,
  ButtonsStateEmpty,
  browserMouseButtonToSpiceMouseButton,
  browserMouseButtonToSpiceMouseButtonMask,
  mouseButtonsStateSet,
  mouseButtonsStateUnset,
  getConsoleJSONLogger,
  InputsMouseMotion,
  InputsMousePress,
  InputsMouseRelease,
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

  var buttons_state = ButtonsStateEmpty;

  //TODO add to util.ts as a helper function
  //TODO rename
  //TODO already implemented in util.ts?
  function setMouseMask(button, upOrDown) {
    let mask = 1 << (button - 1);

    if (upOrDown === "up") {
      buttons_state &= ~mask;
    } else {
      buttons_state |= mask;
    }
  }

  ws.on('message', (msg) => {
    let payload = JSON.parse(msg);

    if (inputsChannel !== undefined) {
      //TODO optimize if else chain
      //TODO use mouse press and mouse release messages
      //TODO implement mouse press and mouse release messages

      if (payload.type === 'mousedown') {
        let button = browserMouseButtonToSpiceMouseButton(payload.button);
        let mask = browserMouseButtonToSpiceMouseButtonMask(payload.button);

        if (button == null || mask == null) {
          return;
        }

        buttons_state = mouseButtonsStateSet(buttons_state, mask);
        // setMouseMask(payload.buttons, "down");
        // inputsChannel.send(new InputsMouseMotion(0, 0, buttons_state));
        inputsChannel.send(new InputsMousePress(button, buttons_state));
      } else if (payload.type === 'mouseup') {
        let button = browserMouseButtonToSpiceMouseButton(payload.button);
        let mask = browserMouseButtonToSpiceMouseButtonMask(payload.button);
        
        if (button == null || mask == null) {
          return;
        }

        buttons_state = mouseButtonsStateUnset(buttons_state, mask);
        // setMouseMask(payload.buttons, "up");
        // inputsChannel.send(new InputsMouseMotion(0, 0, buttons_state));
        inputsChannel.send(new InputsMouseRelease(button, buttons_state))
      } else if (payload.type === 'mousemove') {
        inputsChannel.send(new InputsMouseMotion(payload.movementX, payload.movementY, buttons_state));
      }

      console.log(buttons_state);//TODO remove
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
