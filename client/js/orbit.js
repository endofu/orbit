
$(function() {
orbit = window['orbit'] = {}
orbit.draw = function() {
    requestAnimationFrame(orbit.draw);
    $('body').css("background-color", "yellow");
}


orbit.socket = io.connect('http://localhost');
orbit.socket.on('bang', function (data) {
    console.log(data);
    orbit.draw();
    //socket.emit('my other event', { my: 'data' });
});
})




