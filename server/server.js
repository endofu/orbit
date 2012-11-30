var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , propagator = require('./propagator').Propagator;

server.listen(8080);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/templates/index.html');
});

app.get('/debug', function (req, res) {
  res.sendfile(__dirname + '/templates/debug.html');
});

app.get('/performance', function (req, res) {
  res.sendfile(__dirname + '/templates/performance.html');
});

app.use(express.static(__dirname));

var in_circle = [];
var samplebuffers = {};

var recircle = function() {
	console.log('reindex circle');
	for (var i=0; i<in_circle.length; i++) {
		in_circle[i].emit('index', { index: i, size: in_circle.length });
	}
}

var propagate = function(event) {
	console.log('propagate', event);
	var type = event.type || -1;
	console.log('type', type);
	var fun = propagator.CircularRipple;
	console.log('call', fun, type, event.source, in_circle.length);
	var order = fun(event.source, in_circle.length);
	console.log('propagation order', order);
	var delay = 0;
	order.forEach(function(thisorder) {
		console.log('emitting for delay='+delay);
		thisorder.forEach(function(idx) {
			console.log('emitting to',idx);
			var newevent = event;
			newevent.to = idx;
			newevent.delay = delay;
			newevent.delaynorm = delay / order.length;
			newevent.seqlength = order.length;
			in_circle[idx].emit('bang', newevent);
		});
		delay++;
	})
};

io.sockets.on('connection', function (socket) {

	socket.emit('welcome', {});

	setTimeout(function() {
		in_circle.push(socket);
		recircle();
	}, 100);

  socket.on('bang', function (data) {
    console.log('got bang from peer!', data);
    propagate(data);
  });

	socket.on('disconnect', function () {
		var idx = in_circle.indexOf(socket);
		in_circle.splice(idx, 1);
		recircle();
	});

});
