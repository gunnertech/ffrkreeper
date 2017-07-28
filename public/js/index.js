(function() {
    var socket = io({ transports: ['websocket'] });
    var LOOP_FREQUENCY = 6000;

    function createCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) {
        createCookie(name, "", -1);
    }


    var messages = [];

    function renderDrops(message) {
        console.log(message)
        var showDrop = (messages.length === 0 || (message.name && message.name != messages[messages.length - 1].name) || (!message.name && messages[messages.length - 1].name));

        if (!showDrop) {
            return "";
        }

        var html = '';
        messages.push(message);


        if (message.message) {
            html += '<div class="alert alert-danger">' + message.message + '</div>';
        } else if (message.drops == 0) {
            html += '<div class="alert alert-warning">Nope! There ain\'t nothing dropping.</div>';
        } else {
            html = '<ul class="list-unstyled">';
            $.each(message.drops, function(i, drop) {
                var rarity = parseInt(drop.rarity);
                var dropRate = _.find((drop.battle.dropRateModels || []), function(dropRate) {
                    return dropRate.item == drop.item._id;
                });

                html += '<li class="media">';
                html += '<img class="d-flex mr-3" src="' + drop.item.imgUrl + '" alt="' + drop.item.dena.name + '">';
                html += '<div class="media-body">';
                html += '<h6 class="mt-0">';
                html += (drop.item.dena.name + ' x' + drop.qty);
                if (drop.round) {
                    html += ' - Round ' + drop.round;
                }
                html += '</h6>';
                html += '<ul class="list-unstyled">'
                html += '<li>Battle: <a href="/battles/' + drop.battle._id + '">' + drop.battle.name + '</a></li>';
                if (dropRate) {
                    html += '<li>Dropped in ' + (dropRate.successCount) + ' out of ' + dropRate.runCount + ' runs (' + (Math.round(dropRate.successRate * 100)) + '%)</li>';
                    html += '<li>Avg/Run: ' + (Math.round(dropRate.perRun * 100) / 100) + '</li>';
                    if (dropRate.perStamina) {
                        html += '<li>Avg/Stam: ' + (Math.round(dropRate.perStamina * 100) / 100) + '</li>';
                    }
                }
                html += '</ul>'
                html += '</div>';
                html += '</li>';
            });
            html += '</ul>';
        }

        return html;
    }

    function signin() {
        if (event) { event.preventDefault(); }

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
            if (user.name == 'SessionError') {
                console.log(user);
                alert("That session id is not valid. Please signout and try again");
                return signout();
            }

            createCookie('denaSessionId', user.dena.sessionId, 365);
            createCookie('phone', user.phone, 365);
            createCookie('email', user.email, 365);
            createCookie('alertLevel', user.alertLevel, 365);

            $("#welcome").hide();
            $("#drops").show();
            $("#signout-form").show();

            var timer = null;
            socket.on('/battle_message', function(message) {
                $('#attach-point').prepend(renderDrops(message));
                clearTimeout(timer);
                timer = setTimeout(function() {
                    console.log("From the client");
                    if (!signedOut) {
                        socket.emit('/request_drops', { sessionId: user.dena.sessionId });
                    }
                }, 3000);

            });
            socket.emit('/request_drops', { sessionId: user.dena.sessionId })
            $(".drop-loading-wrapper").show();

        });
    }

    var signedOut = false;

    function signout() {
        if (event) { event.preventDefault(); }

        signedOut = true;

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
            $(".drop-loading-wrapper").hide();

            console.log("Signed Out!");
        });
    }

    socket.on('connect', function() {
        $('#session-id').val(readCookie('denaSessionId') || "");
        $('#phone').val((readCookie('phone') || "").replace(/null/, "").replace(/undefined/, ""));
        $('#email').val((readCookie('email') || "").replace(/null/, "").replace(/undefined/, ""));
        $('#alert-level').val(readCookie('alertLevel') || "0");

        if (
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