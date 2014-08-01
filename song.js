/*
 * SONG.JS
 * A GENERATIVE MUSIC FILE THAT REQUIRES WEB AUDIO
 * CREATED BY FINNBAR KEATING
 * LICENSE: CC-BY-SA
 * THIS TAKES AN INPUT STRING (USUALLY A TWEET) AND MAKES IT INTO MUSIC OF A CERTAIN MOOD
 *
 * Usage Instructions:
 * To utilise this file, include it as per usual with <script src="..."></script> or whatever.
 * If you haven't already started WebAudio elsewhere (aka created an AudioContext somewhere), you must run setupAudio().
 * This will also alert the user in the event that their browser is too old *cough*Internet Explorer*cough*
 * Then, to parse the actual tweet, run parseInput(tweet,mood), where mood is "neg" for negative and "pos" for positive.
 * (although it uses an if else so "neg" is negative whilst everything else is positive)
 * There are also a few changeable variables which may prove useful.
 * wordsPerBloop and lettersPerBloop are the number of words or letters it should use per note that it plays.
 * So, if lettersPerBloop is 2, the script will only play a bloop for every second letter, aka, it will skip every other letter
 * availableTime is another available variable that you can mess with.
 * This sets the amount of time you would like the script to take on this message - a smaller time means faster notes!
 * If you want to bypass this restriction (make each note take x seconds), simply see the comment on line 168.
*/

var context; //Our AudioContext, the thing which actually produces sound
var osc;     //Our Oscillator, the thing which creates cool soundwaves
var oscGain; //Our GainModule, the thing that should fix trailing notes by silencing them

function setupAudio () { //BEGIN THE AUDIO THINGS
	//(aka if userAgent string contains Internet Explorer, you know what to do...)
	if(/MSIE/g.test( navigator.userAgent )) alert("Get a better browser, please, for your own sake :(");
	console.log("INITIALISING");
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		context = new AudioContext();
	}
	catch(ex) {
		alert("A wild "+ex+" exception appeared! It used CRASH BROWSER! It's super effective!\n\nYour browser doesn't support WebAudio D:, so you won't hear the sounds of the interwebs. Please upgrade to a modern browser (Sounds best in Firefox!)")
		//alert("A wild "+ex+" exception appeared! It used CRASH BROWSER! It's super effective!\n\n(or to put it more simply, your browser doesn't support Web Audio so you won't hear anything)");
	}
	console.log("Web Audio works!");
	var empty = context.createBuffer(1,1,44100); //RIGHT, THIS IS FOR FIXING iOS...
	var emptyData = empty.getChannelData(0);
	var emptySource = context.createBufferSource();
	emptySource.buffer = empty;
	emptySource.connect(context.destination);
	emptySource.start(0);
	console.log("emptySource playing/completed"); //To be precise, this plays a very short (1/44100 seconds) sample to bypass iOS' funny stuff
	osc = context.createOscillator();
	oscGain = context.createGain();
	osc.connect(oscGain); //Connect up the oscillator to the gain
	oscGain.connect(context.destination); //And the gain to the destination
	oscGain.gain.value = 0; //SILENCE, FOOL!
	osc.start(); //Then start the oscillator anyway
}

var notes = [261.63,277.18,293.66,311.13,329.63,349.23,369.99,392,415.3,440,466.16,493.88,523.25,554.37,587.33,622.25,659.25,698.46,739.99,783.99,830.61,880,932.33,987.77]; //frequencies of C3->B4
var majorPattern = [0,2,4,7,9,12,14,16,19,21];
var minorPattern = [0,3,5,7,10,12,15,17,19,22]; //degrees for each scale...

var pos = 0; //what note
var scale = 0; //of what scale
var key = 0; //in what key?
var prevScale = 0;

function getNotesInKey(key, scale) { // key: 0 == C, 1 == C# and so on, scale: 0 == maj, 1 == min
	var result = [];
	for(var i=0;i<10;i++) {
		result[i] = scale==0 ? majorPattern[i] : minorPattern[i]; //major or minor? grab the right scale
		result[i] += key; //set it to the actual key in question (based off C)
		if(result[i]>23) {
			result[i] = (result[i]-24) + 12; // wrap around this octave
		}
	}
	return result;
}

function nextNote(input,multiplierPicker) { //multiplier picker is the prev. char, or "a" if there isn't one
	var code = input.charCodeAt(0); //get the char code to work out what interval we will be using
	if(input==" ") { //if it's a space then change the key!
		var multiplier = multiplierPicker.charCodeAt(0) % 2 == 0 ? 1 : -1; //up or down? the previous char decides!
		key += multiplier*7; //up or down seven semitones
		if(key<0) key+=12; //wrap around
		if(key>11) key-=12;
	} else {
		switch(code%18) { //YEAH, YOU HEARD ME! 18!
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
				pos++; //most probable
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
	if(pos<0) pos+=10; //wrap back around
	if(pos>9) pos-=10;
	return getNotesInKey(key,scale)[pos]; //return pos from the scale of key (scale)
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
		if(placeInWord>0) { //if there's a previous char, use that
			note=nextNote(word.charAt(placeInWord),word.charAt(placeInWord-1));
		} else { //else just use "a"
			note=nextNote(word.charAt(placeInWord),"a");
		}
		placeInWord+=lettersPerBloop; //continue through the word
		var a = scale==1 ? notes[note]/2 : notes[note];
		osc.frequency.value = a; //play the note!
		if(placeInWord>=word.length) clearInterval(splittingWord); //clear when done
		setTimeout(function() { //two-thirds of the way through the note, drop its volume by 50%
			oscGain.gain.value = 0.5;
		},minisculeDelay-=(minisculeDelay/3));
	},minisculeDelay); //repeat for the rest of the word!
}

function parseInput(input,mood) { //right, here we go!
	if(mood == "neg") {
		scale = 1; //minor
	} else {
		scale = 0; //major
	}
	if(scale==0 && prevScale==1) { //go to RELATIVE major
		key+=3;
		if(key>11) key-=12;
	} else if(scale==1 && prevScale==0) { //go to RELATIVE minor
		key-=3;
		if(key<0) key+=12;
	}
	var pos = 0;
	var words = input.match(regexp);
	var inputPosition = 0;
	//var availableTime = (words.length+1)*1000 //sets each word to take a second to complete SEE ABOVE
	var delay = (availableTime/(words.length+1))*wordsPerBloop; //+1 because setInterval waits, splits the time equally between the words
	//oscGain.gain.value=0;
	var parsing = setInterval(function () {
		parseWord(input.substring(inputPosition,inputPosition+words[pos].length),delay); //get and play the word
		for(var i=0;i<wordsPerBloop;i++) {
			if(words[pos+i]) inputPosition+=words[pos+i].length; //increment to the next word
		}
		pos+=wordsPerBloop;
		if(pos>=words.length) {
			clearInterval(parsing); //clear when done
		}
	},delay);
	prevScale = scale;
}
