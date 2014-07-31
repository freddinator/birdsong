var context;
var osc;
var oscGain;

function setupAudio () {
	//(aka if userAgent string contains Internet Explorer, you know what to do...)
	if(/MSIE/g.test( navigator.userAgent )) alert("Get a better browser, please, for your own sake :(");
	console.log("INITIALISING");
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		context = new AudioContext();
	}
	catch(ex) {
		alert("Your browser doesn't support WebAudio D:, so you won't hear the sounds of the interwebs. Please upgrade to a modern browser (Sounds best in Firefox!)")
		//alert("A wild "+ex+" exception appeared! It used CRASH BROWSER! It's super effective!\n\n(or to put it more simply, your browser doesn't support Web Audio so you won't hear anything)");
	}
	console.log("Web Audio works!");
	var empty = context.createBuffer(1,1,44100);
	var emptyData = empty.getChannelData(0);
	var emptySource = context.createBufferSource();
	emptySource.buffer = empty;
	emptySource.connect(context.destination);
	emptySource.start(0);
	console.log("emptySource playing/completed");
	osc = context.createOscillator();
	oscGain = context.createGain();
	osc.connect(oscGain);
	oscGain.connect(context.destination);
	oscGain.gain.value = 0;
	osc.start();
}

var notes = [261.63,277.18,293.66,311.13,329.63,349.23,369.99,392,415.3,440,466.16,493.88,523.25,554.37,587.33,622.25,659.25,698.46,739.99,783.99,830.61,880,932.33,987.77];
var majorPattern = [0,2,4,7,9,12,14,16,19,21];
var minorPattern = [0,3,5,7,10,12,15,17,19,22]; //degrees for each scale...

function getNotesInKey(key, scale) { // key: 0 == C, 1 == C# and so on, scale: 0 == maj, 1 == min
	var result = [];
	for(var i=0;i<10;i++) {
		result[i] = scale==0 ? majorPattern[i] : minorPattern[i];
		result[i] += key;
		if(result[i]>23) {
			result[i] = (result[i]-24) + 12; // wrap around this octave
		}
	}
	return result;
}

var pos = 0;
var key = 0;
var scale = 0;

function nextNote(input,multiplierPicker) { //multiplier picker is the prev. char, or "a" if there isn't one
	var code = input.charCodeAt(0);
	if(input==" ") {
		var multiplier = multiplierPicker.charCodeAt(0) % 2 == 0 ? 1 : -1;
		key += multiplier*7;
		if(key<0) key+=12;
		if(key>11) key-=12;
	} else {
		switch(code%18) {
			case 0:
				pos+=3;
				break;
			case 1:
			case 2:
			case 3:
				pos+=2;
				break;
			case 4:
			case 5:
			case 6:
			case 7:
				pos++;
				break;
			case 10:
			case 11:
			case 12:
			case 13:
				pos--;
				break;
			case 14:
			case 15:
			case 16:
				pos-=2;
				break;
			case 17:
				pos-=3;
				break;
		}
	}
	if(pos<0) pos+=10;
	if(pos>9) pos-=10;
	return getNotesInKey(key,scale)[pos];
}

var regexp = /[\w\']+\s*/g; //matches words, I think
// regexp.exec(string); OR
// string.match(regexp);
var lettersPerBloop = 2;
var wordsPerBloop = 2;
var availableTime = 1500;
// speed controls: more letters/words per bloop means slower
// more available time means slower

function parseWord(word,delay) {
	//take a single word and set up the intervals...
	var minisculeDelay = (delay/(word.length+1))*lettersPerBloop;
	// +1 because setInterval waits (oh crap)
	var placeInWord = 0;
	var splittingWord = setInterval(function () {
		//oscGain.gain.value = 1;
		var note;
		if(placeInWord>0) {
			note=nextNote(word.charAt(placeInWord),word.charAt(placeInWord-1));
		} else {
			note=nextNote(word.charAt(placeInWord),"a");
		}
		placeInWord+=lettersPerBloop;
		osc.frequency.value = notes[note];
		if(placeInWord>=word.length) clearInterval(splittingWord);
		setTimeout(function() {
			oscGain.gain.value = 0.5;
		},minisculeDelay-=(minisculeDelay/3));
	},minisculeDelay);
}

function parseInput(input,mood) {
	if(mood == "neg") {
		scale = 1;
	} else {
		scale = 0;
	}
	var pos = 0;
	var words = input.match(regexp);
	var inputPosition = 0;
	var delay = (availableTime/(words.length+1))*wordsPerBloop; //+1 because setInterval waits
	//oscGain.gain.value=0;
	var parsing = setInterval(function () {
		parseWord(input.substring(inputPosition,inputPosition+words[pos].length),delay);
		for(var i=0;i<wordsPerBloop;i++) {
			if(words[pos+i]) inputPosition+=words[pos+i].length;
		}
		pos+=wordsPerBloop;
		if(pos>=words.length) {
			clearInterval(parsing);
		}
	},delay);
}