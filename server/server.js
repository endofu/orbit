var express = require('express')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , fs = require('fs')
    , propagator = require('./propagator').Propagator;


var myip = '127.0.0.1';

var os=require('os');
var ifaces=os.networkInterfaces();
for (var dev in ifaces) {
  var alias=0;
  ifaces[dev].forEach(function(details){
    if (details.family=='IPv4') {
      console.log(dev, dev+(alias?':'+alias:''),details.address);
      if (dev.substring(0,2)=='en')
      	myip = details.address;
      ++alias;
    }
  });
}

console.log('MY IP:', myip);




server.listen(80);

app.get('/', function (req, res) {
	var c = fs.readFileSync(__dirname + '/templates/index.html', 'utf8');
	c = c.toString().replace('{{serverip}}', myip);
  c = c.toString().replace('{{serverip}}', myip);
  res.setHeader('Content-Type', 'text/html');
  res.end(c);
});

app.get('/debug', function (req, res) {
  res.sendfile(__dirname + '/templates/debug.html');
});

app.get('/play', function (req, res) {
	var c = fs.readFileSync(__dirname + '/templates/performance.html', 'utf8');
	c = c.toString().replace('{{serverip}}', myip);
  c = c.toString().replace('{{serverip}}', myip);
  res.setHeader('Content-Type', 'text/html');
  res.end(c);
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
	var fun = propagator.Linear;
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
