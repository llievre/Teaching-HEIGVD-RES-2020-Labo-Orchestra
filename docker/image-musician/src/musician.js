const uuid = require('uuid');
const moment = require('moment');
const dgram = require('dgram');

const UDP_PORT = 2204;
const ADR_MULTICAST = "225.226.227.228";

var instruments = new Map([
	["piano", "ti-ta-ti"],
	["trumpet", "pouet"],
	["flute", "trulu"],
	["violin", "gzi-gzi"],
	["drum", "boum-boum"]
]);

if(process.argv.length < 3){
	console.error("Pas assez d'argument");
	return;
}

//only take the first argument passed
const chosenInstrument = process.argv[2];
const sound = instruments.get(chosenInstrument);

if(sound == undefined) {
	console.error("Instrument inconnu");
	return;
}

const socket = dgram.createSocket('udp4');

const message = Buffer.from(
		JSON.stringify({
			uuid: uuid.v4(),
			sound: sound,
			activeSince: moment().format()
		})
	);

function sendMessage(){
	socket.send(message, UDP_PORT, ADR_MULTICAST, (err) => {
		console.log("Envoi de " + message);
	}
	);
}

//send message every second
setInterval(sendMessage, 1000);
