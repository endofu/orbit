function Bang() {
	this.socket = null;
  this.index = -1;
  this.size = 0;
  this.bangHandler = null;
  this.indexChangedHandler = null;
}

Bang.prototype.setBangHandler = function(handler) {
	this.bangHandler = handler;
}	

Bang.prototype.setIndexChangedHandler = function(handler) {
	this.indexChangedHandler = handler;
}

Bang.prototype.start = function() {
 	this.socket = io.connect('http://localhost');
  this.socket.on('welcome', function (data) {
   	// console.log('We\'re in the game!', data);
  });
	var self = this;
  this.socket.on('index', function (data) {
    console.log('Got index event', data);
    self.index = data.index,
    self.size = data.size;
   	console.log('You\'re index '+self.index+' of '+self.size);
   	// document.getElementById('number').innerHTML = (my_index+1)+'/'+circle_size;
   	self.indexChangedHandler();
  });
  this.socket.on('bang', function (data) {
  	console.log('Got bang from server', data);
    if (data.to != self.index)
      return;
  	self.bangHandler(data);
	});
}

Bang.prototype.bang = function(event) {
	event.source = this.index;
  this.socket.emit('bang', event);
}



var _encodeAudio = function(input) {
  var s = [];
  for (var i=0; i<input.length; i++)
    s.push(Math.round(128 + 127 * input[i]));
  // var e = s.join(',');
  return s;
}

var _decodeAudio = function(input) {
	return input.map(function(x) { return x / 128.0 - 1.0; });
}




