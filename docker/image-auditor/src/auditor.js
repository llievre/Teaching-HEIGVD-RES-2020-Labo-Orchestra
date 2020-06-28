const net = require('net');
const moment = require('moment');
const dgram = require('dgram');

const TCP_PORT = 2205;
const UDP_PORT = 2204;
const ADR_MULTICAST = "225.226.227.228";
const SECONDS_INACTIVE = 5;

const server = net.createServer();

var sounds = new Map([
	["ti-ta-ti", "piano"],
	["pouet", "trumpet"],
	["trulu", "flute"],
	["gzi-gzi", "violin"],
	["boum-boum", "drum"]
]);

const socket = dgram.createSocket('udp4');

socket.bind(UDP_PORT, ADR_MULTICAST, () => { 
	socket.addMembership(ADR_MULTICAST); 
});

var activeMusicians = new Map();

socket.on("listening", () => {
	console.log("Listening on "+ ADR_MULTICAST + ":" + UDP_PORT);
});

socket.on("message", function (msg, rinfo) {
	console.log("Message : " + msg);
	var musician = JSON.parse(msg.toString());
	musician.timeLastSound = moment().format(); //date de derniere activite
	activeMusicians.set(musician.uuid, musician); //ajoute une copie du musicien
});

socket.on("error", (err) => {
	console.log("Error : " + err.stack);
});

server.on("connection", s => {
	var array = [];
	
	activeMusicians.forEach(m => {
		array.push({
			uuid: m.uuid,
			instrument: sounds.get(m.sound),
			activeSince: m.activeSince
		});
	});
	
	s.write(JSON.stringify(array));
	s.end();
});

function checkMusicians(){
	activeMusicians.forEach(m => {
		const diff = moment().diff(m.timeLastSound, "second");
		console.log(m.uuid + " : " + diff);
		if(diff > SECONDS_INACTIVE){
			activeMusicians.delete(m.uuid);
			console.log("Suppression de : " + m.uuid);
		}
	});
	
}

setInterval(checkMusicians, 1000);
server.listen(TCP_PORT);

