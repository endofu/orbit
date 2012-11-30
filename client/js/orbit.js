
$(function() {
    orbit = window['orbit'] = {}
    orbit.debug = true;
    orbit.draw = function() {
        requestAnimationFrame(orbit.draw);
        $('body').css("background-color", "yellow");
    }

    if (!orbit.debug)
    {
        orbit.socket = io.connect('http://localhost');
        orbit.socket.on('handshake', function (data) {
            console.log(data);
            orbit.draw();
            //socket.emit('my other event', { my: 'data' });
        });
        orbit.socket.on('newsound', function (data) {
            console.log(data);
        });
    }
})




