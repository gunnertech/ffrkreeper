(function() {
  var socket = io();
  var LOOP_FREQUENCY = 6000;
  var getDropsInterval = null;
  var statusTimer = setTimeout(function() {
    // $('.badge-default').hide();
    // $('.badge-success').hide();
    // $('.badge-danger').show();
  }, LOOP_FREQUENCY);

  function createCookie(name, value, days) {
    var expires = "";
    if(days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  }

  function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while(c.charAt(0) == ' ') c = c.substring(1, c.length);
      if(c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  function eraseCookie(name) {
    createCookie(name, "", -1);
  }

  function getDropMessageFor(user) {
    // socket.emit('/drops', user.dena.sessionId, function(message) {
    //   $('#attach-point').prepend(renderDrops(message));
    //   setTimeout(function(){ getDropMessageFor(user) }, LOOP_FREQUENCY)
    // });
  }

  var messages = [];
  function renderDrops(message) {
    var showDrop = (messages.length === 0 || (message.name && message.name != messages[messages.length - 1].name) || (!message.name && messages[messages.length - 1].name));
    var html = '<table class="table table-striped"><thead class="thead-inverse"><tr><th colspan="2">Your Loot</th></tr></thead><tbody>';

    if(!showDrop) {
      return "";
    }

    messages.push(message);

    if(message.name == "Session Error") {
      signout();
    }

    if(message.message) {
      html += '<tr class="table-danger"><td colspan="2"><strong>' + message.message + '</td></tr>';
    } else if(message.drops == 0) {
      html += '<tr class="table-warning"><td colspan="2"><strong>Nope!</strong> There ain\'t nothing dropping.</td></tr>';
    } else {
      $('#left-side').hide() //hide instructions if we have at least one successful drop

      $.each(message.drops, function(i, drop) {
        var rarity = parseInt(drop.rarity);

        html += '<tr class="table-' + (rarity > 4 ? 'success' : 'info') + '">';
        html += '<td class="img-cell">';
        html += '<img class="img-fluid" src="' + drop.image + '" />';
        html += '</td>';
        html += '<td>';
        html += (drop.name + ' x' + drop.num);
        if(drop.round) {
          html += ' - Round ' + drop.round;
        }
        if(drop.dropRate) {
          // We have to increase the server value by one, because the client actually tells the server if it was a new drop
          drop.dropRate.hits++;
          drop.dropRate.total++;
          drop.dropRate.rate = (drop.dropRate.hits * 1.0) / (drop.dropRate.total * 1.0);

          html += '<p>Drop Rate: ' + Math.round(drop.dropRate.rate * 100) + '% - ' + (drop.dropRate.hits) + ' out of ' + (drop.dropRate.total) + ' drops for <a href="/dungeon/'+drop.denaDungeonId+'/battles">this battle</a> have been for this item.</p>';
        }
        html += '</td>';
        html += '</tr>';
      });
    }

    html += '</tbody></table>';

    return html;
  }

  function signin() {
    $("#btn-signin").hide();
    $("#btn-signout").show();
    $("form").hide();

    var sessionId = $('#session-id').val();
    var phone = $('#phone').val();
    var email = $('#email').val();
    var alertLevel = $('#alert-level').val();

    createCookie('denaSessionId', sessionId, 365);
    createCookie('phone', phone, 365);
    createCookie('email', email, 365);
    createCookie('alertLevel', alertLevel, 365);

    socket.emit('/signin', {
      sessionId: sessionId,
      phone: phone,
      email: email,
      alertLevel: alertLevel
    }, getDropMessageFor);
  }

  function signout() {
    $("#btn-signin").show();
    $("#btn-signout").hide();
    $("form").show();
    $('#left-side').show();

    var sessionId = $('#session-id').val();
    var phone = $('#phone').val();
    var email = $('#email').val();

    eraseCookie('denaSessionId');
    eraseCookie('phone');
    eraseCookie('email');
    eraseCookie('alertLevel');

    // socket.emit('/signout', {
    //   sessionId: sessionId,
    //   phone: phone,
    //   email: email
    // }, function(data) {
    //   console.log("Signed Out!");
    //   clearInterval(getDropsInterval);
    // });
  }

  $('#session-id').val(readCookie('denaSessionId'));
  $('#phone').val(readCookie('phone'));
  $('#email').val(readCookie('email'));
  $('#alert-level').val(readCookie('alertLevel'));

  setTimeout(function() {
    if(
      $('#session-id').val() ||
      $('#phone').val() ||
      $('#email').val()
    ) {
      console.log("Let's try to sign in");
      signin();
    }
  }, 2000)

  $('#btn-instructions').click(function(event) {
    event.preventDefault();
    $('#instructions').toggle();
  });

  $("#btn-signin").click(signin);
  $("#btn-signout").click(signout);

  // socket.on('time', function(timeString) {
  //   clearTimeout(statusTimer);
  //   statusTimer = setTimeout(function() {
  //     // $('.badge-default').hide();
  //     // $('.badge-success').hide();
  //     // $('.badge-danger').show();
  //   }, LOOP_FREQUENCY);

  //   // $('.badge-default').hide();
  //   // $('.badge-success').show();
  //   // $('.badge-danger').hide();
  //   // $('#server-time').html(timeString);
  // });
})();