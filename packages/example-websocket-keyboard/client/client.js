document.addEventListener('DOMContentLoaded', () => {
  const wss = new WebSocket('ws://localhost:8080');

  let connected = false;
  let keyDiv = document.getElementById('key');

  function sendKeyEvent(event) {
    console.log(JSON.stringify(event));

    if (connected) {
      wss.send(
        JSON.stringify({
          type: event.type,
          code: event.code,
        })
      );
    }
  }

  function visualizeKeyEvent(event) {
    if (connected) {
      if (event.type == 'keydown') {
        keyDiv.innerHTML = event.key;
        keyDiv.classList.remove('fade-out');
      } else {
        keyDiv.classList.add('fade-out');
      }
    }
  }

  wss.onopen = () => {
    window.addEventListener('keydown', sendKeyEvent);
    window.addEventListener('keyup', sendKeyEvent);

    window.addEventListener('keydown', visualizeKeyEvent);
    window.addEventListener('keyup', visualizeKeyEvent);

    connected = true;
  };

  wss.onmessage = (msg) => {
    console.log(msg);
  };

  wss.onclose = (event) => {
    connected = false;

    keyDiv.innerHTML = 'DISCONNECTED';
    keyDiv.classList.remove('fade-out');
    keyDiv.classList.add('warn');
  };

  window.wss = wss;
});
