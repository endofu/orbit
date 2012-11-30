/**
 * Created with IntelliJ IDEA.
 * User: gaboszal
 * Date: 30/11/2012
 * Time: 13:50
 * To change this template use File | Settings | File Templates.
 */
var socket = io.connect('http://192.168.144.164');
var Color = net.brehaut.Color;
var my_index = -1;
var circle_size = 0;
//var step_t = 0;

var context;
buffers = []
var colors = []


var colorFades = []

var convolver;

  var my_sample_data = null;









var _encodeAudio = function(input) {
  var s = [];
  for (var i=0; i<input.length; i++)
    s.push(Math.round(128 + 127 * input[i]));
  return s;
}

var _decodeAudio = function(input) {
    return input.map(function(x) { return x / 128.0 - 1.0; });
}









  var context;
    var numSamples = 16384;
    var passes = 2;
    var totalSamples = numSamples * passes;
    var numChannels = 1;
  var recording = passes + 1;
  var bigData;  // Joined up recording
  var buf;    // Playback buffer
  var source;   // Playback buffer node













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

CIRCLE_T = 3;      //how many milliseconds a full circle is

socket.on('welcome', function (data) {
    console.log('We\'re in the game!', data);
});

//var onUploaded = function (data) {
//    console.log('New sound arrived from ', data.source);
//    context.decodeAudioData(data.audiodata, function (buffer) {
//        buffers[data.source] = buffer;
//        sourceNodes[data.source] = context.createBufferSource();
//        gainNodes[data.source] = context.createGainNode();
//        sourceNodes[data.source].buffer = buffers[data.source];
//        sourceNodes[data.source].connect(gainNodes[data.source]);
//        gainNodes[data.source].connect(context.destination);
//    }, function() {console.log("error")});
//}

//socket.on('upload_and_bang', onUploaded);

socket.on('index', function (data) {
    console.log('Got index event', data);
    my_index = data.index;
    circle_size = data.size;
    //step_t = (circle_size > 0) ? (CIRCLE_T / circle_size) : CIRCLE_T;
    colors = []
    for (var i = 0; i < circle_size; i++)
    {
        colors[i] = Color({hue: 360 * i / circle_size, saturation: 1, value: 1})
    }
    console.log('You\'re index ' + my_index + ' of ' + circle_size);
    $('#number').html(my_index + 1);

    if (my_sample_data) {
        // send my sound of count changed.
        socket.emit('bang', {
            source: my_index,
            encodedAudio: my_sample_data.encodedAudio,
            sampleRate: my_sample_data.sampleRate
        });
    }
});

socket.on('bang', function (event) {
    console.log('Got bang from server', event);
    if (event.to != my_index)
        return;

    console.log('Got bang (for me) from server', event);
    // HANDLE THE ACTUAL TRIGGERING OF SOUND HERE, after delay ms

    var buf;
    if (event.encodedAudio) {
        // we got updated audio
        var totalSamples = event.encodedAudio.length;
        buf = context.createBuffer(1, totalSamples, event.sampleRate);
        var decoded = _decodeAudio(event.encodedAudio);
        buf.getChannelData(0).set(decoded);
        buffers[event.source] = buf
    }

    if(event.play == 1) {
        console.log('we should play!', event);
        var delay = event.delay * 1000;
        setTimeout(function() {
            console.log('fire sound!');
            var buf = buffers[event.source];
            if (buf) {
                var source = context.createBufferSource();
                var gain = context.createGainNode();
                source.buffer = buf;
                source.connect(gain);
                // gain.connect(context.destination);
                gain.connect(convolver);
                convolver.connect(context.destination);
                source.noteOn(context.currentTime);
            }
        }, delay);
    }

//    // DEBUG
//    document.getElementById('debug').innerHTML = 'Bang from #' + data.source + ' with delay ' + delay;
//    setTimeout(function () {
//        document.getElementById('debug').className = 'bang';
//    }, delay);
//    setTimeout(function () {
//        document.getElementById('debug').className = 'no-bang';
//    }, delay + 200);
//    // END_OF_DEBUG
});

function addColorFade(event) {
    colorFades.push({
        color: 360 * event.source / event.seqlength,
        intensity: (1 - event.delaynorm),
        startTime: Date.now()
    })
}

function did_eventually_record_audio_data() {
    var buf = [123, 12, 12, 3, 2, 1, 3];
    socket.emit('upload_and_bang', { source:my_index, audiodata:buf });
}

function bang() {
    socket.emit('bang', { source:my_index, play:1 });
}

function draw() {
    webkitRequestAnimationFrame(draw);

    var now = Date.now()
    var len = colorFades.length
    var colorFade
    for (var i = 0; i < len; i++)
    {
        colorFade = colorFades[i]
        colorFade.intensity -= 0.03;
        if (colorFade.intensity <= 0)
        {
            colorFades.splice(i, 1)
            i--;
        }
    }
    colorFades = _.sortBy(colorFades, function(cf){ return cf.intensity; })
    
    if ((colorFades.length > 1) && colorFades[colorFades.length - 2].intensity > 0)
    {
        var mainColor = colorFades[colorFades.length - 1]
        var secColor = colorFades[colorFades.length - 2]
        $('body').css("backgroundColor",
            Color(
                {
                    hue: mainColor.color,
                    saturation: 1,
                    value: mainColor.intensity
                }).blend(Color(
                {
                    hue: secColor.color,
                    saturation: 1,
                    value: secColor.intensity
                }),
                secColor.intensity / (mainColor.intensity + secColor.intensity)).toCSS() )
    }
    else if ((colorFades.length == 1) && colorFades[colorFades.length - 1].gain.value > 0)
    {
        var mainColor = colorFades[colorFades.length - 1]

        $('body').css("backgroundColor",
            Color({
                hue: mainColor.color,
                saturation: 1,
                value: mainColor.intensity}).toCSS())
    }
    else
    {
        $('body').css("backgroundColor", "#000000");
    }
}





















// success callback when requesting audio input stream
function init(stream) {
  var mediaStreamSource = context.createMediaStreamSource( stream );
  var scriptProcessor = context.createJavaScriptNode(numSamples, numChannels, numChannels);
  scriptProcessor.onaudioprocess = process;

  // Connect input to script processor
  mediaStreamSource.connect( scriptProcessor);
  scriptProcessor.connect(context.destination);
}

function process (event) {

    if (recording < passes) {
      var data = event.inputBuffer.getChannelData(0);

      try {
        bigData.set(data, numSamples*recording);
      } catch(e) {
        console.log(data.length, numSamples * recording, bigData.length);
      }

    } else if (recording === passes) {
        console.log("upload + bang");
        console.log(bigData);
        var encoded = _encodeAudio(bigData);
        console.log(encoded);
        my_sample_data = {
            encodedAudio: encoded,
            sampleRate: context.sampleRate
        };
        socket.emit('bang', {
            source: my_index,
            encodedAudio: my_sample_data.encodedAudio,
            sampleRate: my_sample_data.sampleRate,
            play: 1
        });
    };
    recording++;
}

function start_recording () {
    console.log("recording!");
    bigData = new Float32Array(new ArrayBuffer(totalSamples*4));
    recording = 0;
}

navigator.webkitGetUserMedia( { audio: true }, init );

window.onkeydown = function (event) {
    if (event.keyCode === 32) {
        start_recording();
    };
}






$(function () {
    context = new webkitAudioContext();

    var request = new XMLHttpRequest();
    request.open('GET', '/static/sounds/hall.wav', true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
            convolver = context.createConvolver();
            convolver.buffer = buffer;
            convolver.connect(context.destination);
            console.log("conv buffer loaded");
        });
    }
    request.send();
//    bufferLoader = new BufferLoader(
//        context,
//        [
//            '/static/sounds/6164__noisecollector__jillys-sonar.wav',
//            '/static/sounds/25714__wolfsinger__weirdbreath.wav'
//        ],
//        function (bufferlist) {
//            var len = bufferlist.length;
//            for (var i = 0; i < len; i++) {
//                onUploaded({source:i + 1, audiodata:bufferlist[i]})
//            }
//        }
//    );
//
//    bufferLoader.load();

    draw()
})