(function() {

  class SessionDisposable {
    constructor(sessionToken) {
      this.token = sessionToken;
      this.disposed = false;
      let expiration = moment().add(1, 'days').toDate();
      document.cookie = `session_token=${sessionToken};expires=${expiration.toUTCString()}`;
      console.log('Session created: ' + this.token);
    }

    getToken() {
      return this.token;
    }
   
    unsubscribe() {
     if (!this.disposed) {
        this.disposed = true;
        this.token = null;
        document.cookie = 'session_token=; expires=Thu, 01 Jan 197000:00:00 GMT';
        console.log('Ended session! This object has been disposed.');
     }
   }
  }

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

  function addFile($messages, clientSocketId, {name, data, time, socketId}) {
    let div = document.createElement('div');
    div.innerHTML = `
      <div class="w-50 card mb-3 ${clientSocketId === socketId ? 'card-inverse card-primary float-right' : 'card-outline-primary float-left'}"><div class="px-2 py-1 card-block"><blockquote class="card-blockquote">
        <p class="mb-0">
          <a href="${data}" target="_blank"><img src="${data}" class="rounded img-fluid" /></a>
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

      <div class="alert alert-warning typing" role="alert" style="display: none;">
        Someone is typing...
      </div>

      <form>
        <div class="form-group message-container">
          <label for="tio-message">Your Message:</label>
          <textarea class="form-control tio-message" rows="1" wrap="hard"></textarea>
          <small class="form-text text-muted">Only participants in the chat right now will see your messages.</small>
        </div>
        
        <input type="file" class="form-control-file mb-3" value="File" accept="image/*" />
        <input type="submit" class="btn btn-primary btn-block" value="Send" />
        <button class="btn-clear btn btn-danger btn-block">Clear All</button>

        <div class="form-group mt-5">
          <label for="tio-link">Invite Others:</label>
          <input disabled type="text" class="disabled form-control" id="tio-link" value="${[location.protocol, '//', location.host, location.pathname].join('')}?_tio_uid=${uid}" />
          <small class="form-text text-muted">Send this url to anyone whom you'd like to join the chat.</small>
        </div>

        <div class="form-group">
          <label for="tio-key">Chat Key:</label>
          <input disabled type="text" class="disabled form-control" id="tio-key" value="${key}" />
          <small class="form-text text-muted">Anyone who joins this chat will need this key.</small>
        </div>          

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

  function sendFileToServer(data, socket, name, time, uid) {
    socket.emit('file', {
      name: name,
      data: data,
      time: time,
      roomId: uid
    });

  }

  function sendTyping(socket, uid) {
    socket.emit('typing', {
      socketId: socket.id,
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
    return Object.assign({}, data, {message: (key ? CryptoJS.AES.decrypt((data.data || data.message), key).toString(CryptoJS.enc.Utf8) : (data.data || data.message))});
  }

  function decryptFile(data, key) {
    return Object.assign({}, data, {message: (key ? CryptoJS.AES.decrypt(CryptoJS.enc.Base64.parse(data.data), key).toString(CryptoJS.enc.Utf8) : (data.data || data.message))});
  }

  function takeLast(messages) {
    return [].concat(messages).pop();
  }

  function clearMessages($messages) {
    $messages.innerHTML = '';
  }

  function endSession($container, url) {
    $container.innerHTML = '';
    location.href = url;
  }

  function toggleTypingMessage($typing, toggle) {
    $typing.style.display = (toggle == 'hide' ? 'none' : 'block');
  }

  function loadSources(sourceArray, func) {
    let sources = Array.from(sourceArray);

    const src = sources.pop();
    let script = document.createElement('script');

    script.onload = function(){ 
      if(sources.length) {
        loadSources(sources, func);
      } else {
        func();
      }
    }
    script.src = src;
    document.head.appendChild(script);
  }

  function main() {
    const config = Object.assign({}, _tio_config);
    const {name, uid, key, selector} = Object.assign({}, {
      uid: (passedUid() || guid()), 
      key: (typeof config.key == 'undefined' ? (passedUid() ? prompt("Please enter the key for this chat: ") : generateKey()) : config.key),
      selector: 'body'
    }, config);

    render(uid, key, selector);
    
    const url = document.querySelector('#tio-link').value;

    const $input = document.querySelector(".talkitout textarea");
    const $clearBtn = document.querySelector(".talkitout .btn-clear");
    const $form = document.querySelector(".talkitout form");
    const $messages = document.querySelector(".talkitout .messages");
    const $file = document.querySelector(".talkitout .form-control-file");
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

    const file$ = Rx.Observable.create(observer => {
      socket.on('file', data => { observer.next(data); });
    })
    .map(data => decryptFile(data, key));

    const clear$ = Rx.Observable.create(observer => {
      socket.on('clear', data => { observer.next(data); });
    })

    const typing$ = Rx.Observable.combineLatest(
      Rx.Observable.create(observer => {
        socket.on('typing', data => { observer.next(data); });
      }),
      Rx.Observable.of(socket)
    )
    .filter(data => data[0].socketId != `/#${data[1].id}`)

    const participantCount$ = Rx.Observable.create(observer => {
      socket.on('participantCount', data => { observer.next(data); });
    });

    const submitted$ = Rx.Observable.fromEvent($form, 'submit')
    .do(event => event.preventDefault())

    const cleared$ = Rx.Observable.fromEvent($clearBtn, 'click')
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

    const fileChanged$ = Rx.Observable.fromEvent($file, 'change')
    .pluck('target')
    .map(target => target.files[0])
    .filter(file => file)
    .switchMap((file) => {
      const reader = new FileReader();
      const $stream = Rx.Observable.fromEvent(reader, 'load');
      reader.readAsDataURL(file);

      return $stream;
    })
    .pluck('target', 'result')



    ////// SUBSCRIBE TO STREAMS

    fileChanged$.subscribe(data => {
      $file.value = "";
      sendFileToServer(data, socket, name, Date.now(), uid);
    });

    socketId$.subscribe(data => {
      socket.emit('joinRoom', { roomId: uid });
    });

    clear$.subscribe(event => {
      clearMessages($messages);
    });

    cleared$.subscribe(event => {
      socket.emit('clear', { roomId: uid });
    });

    textEntered$.subscribe(text => fitInputToContent($input));

    message$.subscribe(data => addMessage($messages, `/#${socket.id}`, data));
    file$.subscribe(data => addFile($messages, `/#${socket.id}`, data));

    merged$.subscribe((message) => {
      sendMessageToServer(message, socket, name, Date.now(), uid);
      resetInput($input);
      fitInputToContent($input);
    });
    participantCount$.subscribe(count => $participants.innerHTML = `There ${(count == 1 ? 'is' : 'are')} ${count} participant${(count == 1 ? '' : 's')} in this chat.`)

    Rx.Observable.merge(
      Rx.Observable.fromEvent(window, 'mousemove'),
      textEntered$,
      Rx.Observable.empty
    )
    .switchMap(() => Rx.Observable.timer(10 * 60 * 1000/*10 minutes*/) )
    .subscribe(() => endSession(document.querySelector('.talkitout'), url) );

    textEntered$
    .filter(text => text.length > 0)
    .debounceTime(200)
    .subscribe(() => sendTyping(socket, uid) );

    typing$
    .subscribe(() => toggleTypingMessage(document.querySelector('.talkitout .typing'), 'show') );

    typing$
    .switchMap(() => Rx.Observable.interval(10 * 60 * 10/*10 seconds*/) )
    .subscribe(() => toggleTypingMessage(document.querySelector('.talkitout .typing'), 'hide') );
    
  }

  loadSources([
    "https://unpkg.com/rxjs@5.2.0/bundles/Rx.min.js",
    "https://cdn-orig.socket.io/socket.io-1.7.3.js",
    "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js"
  ], main);
})()