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
    password += stringPick(all, 3, 10);
    password = stringShuffle(password);

    return password;
  }

  function fitInputToContent($input) {
    const maxHeight = 500;
    $input.style.height = 'auto';
    $input.style.height = Math.min($input.scrollHeight, maxHeight)+'px';
  }

  function addMessage($messages, {name, message, time}) {
    let div = document.createElement('div');
    div.innerHTML = `
      <cite>${name}</cite> - <time>${new Date(time)}</time>
      <p>${message}</p>`;

    $messages.appendChild(div);
  }

  function formatMessage(data) {
    return Object.assign({}, data, {message: data.message.replace(/\n/g, '<br />')});
  }

  function render(uid, key) {
    let div = document.createElement('div');
    div.innerHTML = `<div class="talkitout">
      <div class="participants"></div>
      <div class="messages">
      </div>
      <div>
        <form>
          <textarea class="tio-message" rows="1" wrap="hard"></textarea>
          <input type="submit" value="Send" />
          <p>Copy and paste the info below into a text message or email and send it to anyone you'd like to join this chat.</p>
          <textarea "tio-info" disabled>To join my chat, please go to the following URL:

${[location.protocol, '//', location.host, location.pathname].join('')}?_tio_uid=${uid}

Once there, you will be prompted for a key. Paste the following into the prompt.

${key}</textarea>
        </form>
      </div>
    </div>`;
    document.body.appendChild(div);
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
    return CryptoJS.AES.encrypt(message, key).toString();
  }

  function decryptMessage(data, key) {
    return Object.assign({}, data, {message: CryptoJS.AES.decrypt(data.message, key).toString(CryptoJS.enc.Utf8)});
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

        const uid = passedUid() || guid();
        // IF there is a passed in UID, it means someone is trying to join. Otherwise, this is a new room
        const key = passedUid() ? prompt("Please enter the key for this chat: ") : generateKey();
        const {name} = Object.assign({}, _tio_config); //Set as a global variable

        render(uid, key);
        
        const $input = document.querySelector(".talkitout textarea");
        const $form = document.querySelector(".talkitout form");
        const $messages = document.querySelector(".talkitout .messages");
        const $participants = document.querySelector(".talkitout .participants");
        // const apiSource = 'http://localhost:3003';
        const apiSource = 'https://ffrk-creeper.herokuapp.com';
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
        message$.subscribe(data => addMessage($messages, data));
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