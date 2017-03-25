(function() {

  function stringPick(str, min, max) {
    var n, chars = '';

    if (typeof max === 'undefined') {
        n = min;
    } else {
        n = min + Math.floor(Math.random() * (max - min + 1));
    }

    for (var i = 0; i < n; i++) {
        chars += str.charAt(Math.floor(Math.random() * str.length));
    }

    return chars;
  }

  function stringShuffle(str) {
    var array = str.split('');
    var tmp, current, top = array.length;

    if (top) while (--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array.join('');
  }

  function generateKey() {
    var specials = '!@#$%^&*()_+{}:"<>?\|[];\',./`~';
    var lowercase = 'abcdefghijklmnopqrstuvwxyz';
    var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var numbers = '0123456789';

    var all = specials + lowercase + uppercase + numbers;

    var password = '';
    password += stringPick(specials, 1);
    password += stringPick(lowercase, 1);
    password += stringPick(uppercase, 1);
    password += stringPick(all, 4, 6);
    password = stringShuffle(password);

    return password;
  }

  function fitInputToContent($input) {
    const maxHeight = 500;
    $input.style.height = 'auto';
    $input.style.height = Math.min($input.scrollHeight, maxHeight)+'px';
  }

  function addMessage($messages, clientSocketId, {name, message, time, socketId}) {
    let div = document.createElement('div');
    div.innerHTML = `
      <div class="mw-50 card mb-3 ${clientSocketId === socketId ? 'card-inverse card-primary float-right' : 'card-outline-primary float-left'}"><div class="px-2 py-1 card-block"><blockquote class="card-blockquote">
        <p class="mb-0">
          ${message}
          ${clientSocketId === socketId ? '' : `- <cite>${name}</cite> <time style="display: none;">- ${new Date(time)}</time>`}
        </p>
      </blockquote></div></div><div class="clearfix"></div>
    `;

    $messages.appendChild(div);
  }

  function formatMessage(data) {
    return Object.assign({}, data, {message: data.message.replace(/\n/g, '<br />')});
  }

  function render(uid, key, selector) {
    let div = document.createElement('div');
    div.innerHTML = `<div class="talkitout">
      <div class="alert alert-warning participants" role="alert">
        <strong>Warning!</strong> Better check yourself, you're not looking too good.
      </div>
      <div class="messages mb-3 mt-3">
      </div>

      <form>
        <div class="form-group message-container">
          <label for="tio-message">Your Message:</label>
          <textarea class="form-control tio-message" rows="1" wrap="hard"></textarea>
          <small class="form-text text-muted">Only participants in the chat right now will see your messages.</small>
        </div>
        
        
        <input type="submit" class="btn btn-primary btn-block" value="Send" />

        <div class="form-group share-container mt-5">
          <label for="tio-message">Invite Others:</label>
          <textarea class="form-control tio-share" rows="8" disabled>To join my chat, please go to the following URL:

${[location.protocol, '//', location.host, location.pathname].join('')}?_tio_uid=${uid}

${key ? 'Once there, you will be prompted for a key. Paste the following into the prompt.' : ''}

${key || ''}</textarea>
          <small class="form-text text-muted">Copy and paste the info below into a text message or email and send it to anyone you'd like to join this chat.</small>
        </div>
        <input type="hidden" class="tio-key" name="tio-key" value="${key}" />
        <input type="hidden" class="tio-uid" name="tio-uid" value="${uid}" />
      </form>
    </div>`;
    document.querySelector(selector).appendChild(div);
  }

  function sendMessageToServer(message, socket, name, time, uid) {
    socket.emit('message', {
      name: name,
      message: message,
      time: time,
      roomId: uid
    });

  }

  function resetInput($input) {
    $input.value = "";
  }

  function passedUid() {
    const match = location.href.match(/_tio_uid=([^&]*)/);

    return match ? match[1] : '';
  }

  function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  function encryptMessage(message, key) {
    return key ? CryptoJS.AES.encrypt(message, key).toString() : message;
  }

  function decryptMessage(data, key) {
    return Object.assign({}, data, {message: (key ? CryptoJS.AES.decrypt(data.message, key).toString(CryptoJS.enc.Utf8) : data.message)});
  }

  function takeLast(messages) {
    return [].concat(messages).pop();
  }

  const sources = [
    "https://unpkg.com/rxjs@5.2.0/bundles/Rx.min.js",
    "https://cdn-orig.socket.io/socket.io-1.7.3.js",
    "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js"
  ];
  
  let toLoad = sources.length;

  sources.forEach(function(src) {
    let script = document.createElement('script');
    script.onload = function() {
      toLoad--;
      if(toLoad === 0) {
        //// SETUP

        const config = Object.assign({}, _tio_config);
        const {name, uid, key, selector} = Object.assign({}, {
          uid: (passedUid() || guid()), 
          key: (typeof config.key == 'undefined' ? (passedUid() ? prompt("Please enter the key for this chat: ") : generateKey()) : config.key),
          selector: 'body'
        }, config);

        render(uid, key, selector);
        
        const $input = document.querySelector(".talkitout textarea");
        const $form = document.querySelector(".talkitout form");
        const $messages = document.querySelector(".talkitout .messages");
        const $participants = document.querySelector(".talkitout .participants");
        const apiSource = location.href.match(/localhost/) ? 'http://localhost:3003' : 'https://ffrk-creeper.herokuapp.com';
        // const apiSource = 'https://ffrk-creeper.herokuapp.com';
        const socket = io(apiSource);
        

        ///STREAMS
        const socketId$ = Rx.Observable.create(observer => {
          socket.on('socketId', data => { observer.next(data); });
        });

        const message$ = Rx.Observable.create(observer => {
          socket.on('message', data => { observer.next(data); });
        })
        .map(data => decryptMessage(data, key))
        .map(formatMessage);

        const participantCount$ = Rx.Observable.create(observer => {
          socket.on('participantCount', data => { observer.next(data); });
        });

        const submitted$ = Rx.Observable.fromEvent($form, 'submit')
        .do(event => event.preventDefault())

        const textEntered$ = Rx.Observable.merge(
          Rx.Observable.fromEvent($input, 'keyup'),
          Rx.Observable.fromEvent($input, 'change'),
          Rx.Observable.fromEvent($input, 'cut'),
          Rx.Observable.fromEvent($input, 'paste'),
          Rx.Observable.fromEvent($input, 'drop')
        )
        .pluck('target', 'value')
        // .filter(text => text.length > 2 )

        const merged$ = textEntered$.buffer(submitted$).filter(updates => updates.length > 0).map(takeLast).map(message => encryptMessage(message, key));



        /// CONNECT TO STREAMS
        socketId$.subscribe(data => {
          socket.emit('joinRoom', { roomId: uid });
        });

        textEntered$.subscribe(text => fitInputToContent($input));
        message$.subscribe(data => addMessage($messages, `/#${socket.id}`, data));
        merged$.subscribe((message) => {
          sendMessageToServer(message, socket, name, Date.now(), uid);
          resetInput($input);
          fitInputToContent($input);
        });
        participantCount$.subscribe(count => $participants.innerHTML = `There ${(count == 1 ? 'is' : 'are')} ${count} participant${(count == 1 ? '' : 's')} in this chat.`)
      }
    };
    script.src = src;
    document.head.appendChild(script);
  });
})()