/**
 * Created with IntelliJ IDEA.
 * User: gaboszal
 * Date: 30/11/2012
 * Time: 13:50
 * To change this template use File | Settings | File Templates.
 */
var socket = io.connect('http://localhost');

var my_index = -1;
var circle_size = 0;
//var step_t = 0;

var context;
var buffers = []
var sourceNodes = []
var gainNodes = []

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}
BufferLoader.prototype.loadBuffer = function (url, index) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;
    request.onload = function () {
        loader.context.decodeAudioData(request.response, function (buffer) {
            if (!buffer) {
                alert('error decoding file data: ' + url);
                return;
            }
            loader.bufferList[index] = buffer;
            if (++loader.loadCount == loader.urlList.length)
                loader.onload(loader.bufferList);
        }, function (error) {
            console.error('decodeAudioData error', error);
        });
    }
    request.onerror = function () {
        alert('BufferLoader: XHR error');
    }
    request.send();
}
BufferLoader.prototype.load = function () {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
}


var LOGICS = {
    RIGHT:{
        dist:function (id, src_id, participant_count) {
            return (id - src_id + participant_count) % participant_count
        },
        delay:function (dist, multiplier) {
            return (dist * multiplier)
        },
        gain:function (dist, participants) {
            return (dist / participants)
        },
        fadeout:function (dist, participants) {
            return (dist / participants)
        }
    }
}

var delayStrategy = LOGICS.RIGHT;

CIRCLE_T = 3;      //how many seconds a full circle is

socket.on('welcome', function (data) {
    console.log('We\'re in the game!', data);
});

var onUploaded = function (data) {
    console.log('New sound arrived from ', data.source);
    context.decodeAudioData(data.audiodata, function (buffer) {
        buffers[data.source] = buffer;
        sourceNodes[data.source] = context.createBufferSource();
        gainNodes[data.source] = context.createGainNode();
        sourceNodes[data.source].buffer = buffers[data.source];
        sourceNodes[data.source].connect(gainNodes[data.source]);
        gainNodes[data.source].connect(context.destination);
    }, function() {console.log("error")});
}

socket.on('upload_and_bang', onUploaded);

socket.on('index', function (data) {
    console.log('Got index event', data);
    my_index = data.index;
    circle_size = data.size;
    //step_t = (circle_size > 0) ? (CIRCLE_T / circle_size) : CIRCLE_T;

    console.log('You\'re index ' + my_index + ' of ' + circle_size);
    $('#number').html(my_index + 1);
});

socket.on('bang', function (data) {
    console.log('Got bang from server', data);
    if (data.to != my_index)
        return;
    // HANDLE THE ACTUAL TRIGGERING OF SOUND HERE, after delay ms

    var distance = delayStrategy.dist(my_index, data.source, circle_size)
    var delay = delayStrategy.delay(distance, DIST_T);

    setTimeout(function () {
        gainNodes[data.source].gain.value = delayStrategy.gain(distance, circle_size);
        sourceNodes[data.source].noteOn()
        gainNodes[data.source].gain.linearRampToValueAtTime(0, delayStrategy.fadeout(distance, circle_size));

    }, delay);


    // DEBUG
    document.getElementById('debug').innerHTML = 'Bang from #' + data.source + ' with delay ' + delay;
    setTimeout(function () {
        document.getElementById('debug').className = 'bang';
    }, delay);
    setTimeout(function () {
        document.getElementById('debug').className = 'no-bang';
    }, delay + 200);
    // END_OF_DEBUG
});

function did_eventually_record_audio_data() {
    var buf = [123, 12, 12, 3, 2, 1, 3];
    socket.emit('upload_and_bang', { source:my_index, audiodata:buf });
}

function bang() {
    socket.emit('bang', { source:my_index, static_sample:1 });
}

$(function () {
    context = new webkitAudioContext();
    bufferLoader = new BufferLoader(
        context,
        [
            '/static/sounds/6164__noisecollector__jillys-sonar.wav',
            '/static/sounds/25714__wolfsinger__weirdbreath.wav'
        ],
        function (bufferlist) {
            var len = bufferlist.length;
            for (var i = 0; i < len; i++) {
                onUploaded({source:i + 1, audiodata:bufferlist[i]})
            }
        }
    );

    bufferLoader.load();
})