const app = require('express')();
const server = require('http').createServer(app);
const socket = require('socket.io-client')('http://10.10.20.80:8080');
const fs = require('fs');

var	dataGestion = require('./neuralnetwork/dataGestion');
var neuralNetwork = require('./neuralnetwork/neuralNetwork');
var mongo = require('./mongo');
var utils = require('./utils');

var nbIn = 250;
var nbHidden = 5;
var dataIntent;


mongo.setURL('mongodb://10.10.20.80:27017');

mongo.findInDB("data").then(res => {
	dataIntent = { "intents": res };
});

socket.emit('nouveau_client', "IA");

// Essai d'update du réseau de neurones en dynamique (appui sur bouton "Réfléchir")
socket.on('updateNN', function (update) {
	if(update) {
		mongo.findInDB("data").then(res => {
			apprentissage({ "intents": res });
		});
	}
});

var lastMessage;

//var myNetwork = JSON.parse(fs.readFileSync(__dirname + '/neuralnetwork/rnPractice.json', 'utf8'));

mongo.findInDB("config").then(res => {
	myNetwork = res[0];
});

socket.on('message', function(data) {
	var mySearch = dataGestion.sentenceToArrayBit(myNetwork.words, data.message, nbIn);

	// Insérer le dernier message dans la base pour agrandir les connaissances de l'IA
	if(!isNaN(data.message) && data.message > 0 && data.message < dataIntent["intents"].length) var message = mongo.fillDB(data.message, lastMessage, dataIntent);

	// Insérer une nouvelle question dans la base
	else if(!isNaN(data.message.split('')[0]) && data.message.split('')[1] === 'q')	var message = mongo.fillDB(data.message, lastMessage, dataIntent, true);

	// Répondre à la question de l'utilisateur
	else {
		var message = neuralNetwork.response(myNetwork.perceptron_after_learn, mySearch, dataIntent);
		lastMessage = data.message;
	}

	socket.emit('message', utils.formatResponse(message, data));
});

console.log("Server listening.");
server.listen(3000);


/*
 *	ICI CODE APPRENTISSAGE
 */
function apprentissage(data) {	
	var dataTransform = dataGestion.prepareData(data);
	var dataTo01 = dataGestion.prepareTraining(dataTransform[0], dataTransform[1], dataTransform[2], nbIn);
	
	// nb de output = au nombre de tag
	var reseau = neuralNetwork.perceptron(nbIn, nbHidden, dataTransform[1].length);
	var jsonLearn = neuralNetwork.learn(dataTo01[0], dataTo01[1], reseau, 0.2);
	var jsonAfterAdd = {
		"classes": dataTransform[1],
		"words": dataTransform[0],
		"perceptron_after_learn": jsonLearn
	};
	
	console.log("Writing neural network config to file...");
	mongo.updateNNConfig(jsonAfterAdd);
	/*fs.writeFile(__dirname + "/neuralnetwork/rnPractice.json", JSON.stringify(jsonAfterAdd), function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("The file was saved!");
	});*/
}

/*
 *	FIN CODE APPRENTISSAGE
 */