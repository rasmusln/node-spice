document.addEventListener('DOMContentLoaded', () => {
  const wss = new WebSocket('ws://localhost:8080');

  let connected = false;

  let statusDiv = document.getElementById('status');
  let movementDiv = document.getElementById('movement');
  let keyDiv = document.getElementById('key');

  function sendKeyEvent(event) {
    console.log(JSON.stringify(event));

    if (connected) {
      wss.send(
        JSON.stringify({
          type: event.type,
          button: event.button,
        })
      );
    }
  }

  function visualizeKeyEvent(event) {
    if (connected) {
      if (event.type == 'mousedown') {
        keyDiv.innerHTML = event.button;
        keyDiv.classList.remove('fade-out');
      } else {
        keyDiv.classList.add('fade-out');
      }
    }
  }

  function sendMouseMoveEvent(event) {
    if (connected) {
      wss.send(JSON.stringify({
        type: event.type,
        movementX: event.movementX,
        movementY: event.movementY
      }));
    }
  }

  function visualizeMouseMoveEvent(event) {
    if (connected) {
      movementDiv.innerHTML = `(${event.movementX},${event.movementY})`;
    }
  }

  wss.onopen = () => {
    window.addEventListener('mousemove', sendMouseMoveEvent);
    window.addEventListener('mousemove', visualizeMouseMoveEvent);

    window.addEventListener('mousedown', sendKeyEvent);
    window.addEventListener('mousedown', visualizeKeyEvent);

    window.addEventListener('mouseup', sendKeyEvent);
    window.addEventListener('mouseup', visualizeKeyEvent);
  
    connected = true;
  };

  wss.onmessage = (msg) => {
    console.log(msg);
  };

  wss.onclose = (event) => {
    connected = false;

    statusDiv.innerHTML = 'DISCONNECTED';
    statusDiv.classList.add('warn');

    keyDiv.classList.remove('fade-out');
  };

  window.wss = wss;
});
