(function() {
  var socket = io();
  var LOOP_FREQUENCY = 6000;

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
    $(".drop-loading-wrapper").show();

    socket.emit('/drops', user.dena.sessionId, function(message) {
      $(".drop-loading-wrapper").hide();
      if(message.name == 'Session Error') {
        alert(message.name + ": " + message.message);
        return signout();
      }

      console.log(message);

      $('#attach-point').prepend(renderDrops(message));
      setTimeout(function(){ getDropMessageFor(user) }, LOOP_FREQUENCY)
    });
  }

  var messages = [];
  function renderDrops(message) {
    var showDrop = (messages.length === 0 || (message.name && message.name != messages[messages.length - 1].name) || (!message.name && messages[messages.length - 1].name));
    
    if(!showDrop) {
      return "";
    }

    var html = '';
    messages.push(message);


    if(message.message) {
      html += '<div class="alert alert-danger">' + message.message + '</div>';
    } else if(message.drops == 0) {
      html += '<div class="alert alert-warning">Nope! There ain\'t nothing dropping.</div>';
    } else {
      html = '<ul class="list-unstyled">';
      $.each(message.drops, function(i, drop) {
        var rarity = parseInt(drop.rarity);

        html += '<li class="media">';
        html += '<img class="d-flex mr-3" src="' + drop.item.imgUrl + '" alt="' + drop.item.dena.name + '">';
        html += '<div class="media-body">';
        html += '<h5 class="mt-0">';
        html += (drop.item.dena.name + ' x' + drop.num);
        if(drop.round) {
          html += ' - Round ' + drop.round;
        }
        html += '</h5>';
        if(drop.dropRate) {
          html += '<p>This item has dropped in <a href="/battles/'+drop.battle+'">' + drop.dropRate.hits + ' out of ' + drop.dropRate.total + ' runs (' + Math.round(drop.dropRate.rate * 100) + '%)</a>.</p>';
        }
        html += '</div>';
        html += '</li>';
      });
      html += '</ul>';
    }

    return html;
  }

  function signin() {
    if(event){ event.preventDefault(); }

    var sessionId = $('#session-id').val();
    var phone = $('#phone').val();
    var email = $('#email').val();
    var alertLevel = $('#alert-level').val();

    $(".signin-loading-wrapper").show();

    socket.emit('/signin', {
      sessionId: sessionId,
      phone: phone,
      email: email,
      alertLevel: alertLevel
    }, function(user) {
      $(".signin-loading-wrapper").hide();
      if(user.name == 'Session Error') {
        alert(user.name + ": " + user.message);
        return signout();
      }

      createCookie('denaSessionId', user.dena.sessionId, 365);
      createCookie('phone', user.phone, 365);
      createCookie('email', user.email, 365);
      createCookie('alertLevel', user.alertLevel, 365);

      $("#welcome").hide();
      $("#drops").show();
      $("#signout-form").show();

      // socket.on('/drops/' + user.dena.sessionId, function(message) {
      //   $('#attach-point').prepend(renderDrops(message));
      // });
      
      getDropMessageFor(user);
    });
  }

  function signout() {
    if(event){ event.preventDefault(); }


    var sessionId = $('#session-id').val();
    var phone = $('#phone').val();
    var email = $('#email').val();

    eraseCookie('denaSessionId');
    eraseCookie('phone');
    eraseCookie('email');
    eraseCookie('alertLevel');

    socket.emit('/signout', {
      sessionId: sessionId,
      phone: phone,
      email: email
    }, function(data) {
      $("#welcome").show();
      $("#drops").hide();
      $("#signout-form").hide();

      console.log("Signed Out!");
    });
  }

  socket.on('connect', function() {
    $('#session-id').val(readCookie('denaSessionId')||"");
    $('#phone').val((readCookie('phone')||"").replace(/null/,"").replace(/undefined/,""));
    $('#email').val((readCookie('email')||"").replace(/null/,"").replace(/undefined/,""));
    $('#alert-level').val(readCookie('alertLevel')||"0");

    if(
      $('#session-id').val() ||
      $('#phone').val() ||
      $('#email').val()
    ) {
      console.log("Got it. Let's sign in")
      setTimeout(signin, 100);
    }
  });

  $("#signin-form").submit(signin);
  $("#signout-form").submit(signout);
  // $("#signout-form").show();

})();