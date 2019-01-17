var app = require('express')(),
    server = require('http').createServer(app);

var socket = require('socket.io-client')('http://10.10.20.80:8080');
const fs = require('fs');
const ent = require('ent');
const sanitize = require('mongo-sanitize');
const MongoClient = require('mongodb').MongoClient;

var nbIn = 250;
var nbHidden = 5;


var	dataGestion = require('./neuralnetwork/dataGestion');
var neuralNetwork = require('./neuralnetwork/neuralNetwork');
var mongo = require('./mongo');



var dataIntent;

const client = new MongoClient('mongodb://10.10.20.80:27017');

client.connect((err, client) => {
	if(err) throw err;
	const db = client.db("ia");
	db.collection('data').find({}).toArray((err, result) => {
		if(err) throw err;
		dataIntent = {
			"intents": result
		};

		// Fonction d'apprentissage du réseau de neurones, à lancer uniquement pour rafraîchir
		// le réseau avec les données de la base nouvellement enregistrées
		//apprentissage(dataIntent);
	});
});

// http://snowball.tartarus.org/algorithms/french/stemmer.html
// http://snowball.tartarus.org/algorithms/french/diffs.txt



socket.emit('nouveau_client', "IA");

// Essai d'update du réseau de neurones en dynamique (appui sur bouton "Réfléchir")
socket.on('updateNN', function (update) {
	if(update) apprentissage(dataIntent);
});

var myReseau = JSON.parse(fs.readFileSync(__dirname+'/neuralnetwork/rnPractice.json', 'utf8'));

var lastMessage;

socket.on('message', function(data) {

	console.log("here");
	var maRecherche = dataGestion.sentenceToArrayBit(myReseau.words, data.message, nbIn);

	// Insérer le dernier message dans la base pour agrandir les connaissances de l'IA
	if(!isNaN(data.message) && data.message > 0 && data.message < dataIntent["intents"].length) var message = insertIntoDB(data.message, lastMessage);
	// Insérer une nouvelle question dans la base
	else if(!isNaN(data.message.split('')[0]) && data.message.split('')[1] === 'q')	var message = insertIntoDB(data.message, lastMessage, true);
	/*else if(data.message.split('^')[0] === 'y') {
		socket.emit("youtube request", data.message.substring(1, data.message.length));
		var message = "Bien sûr, voici la vidéo " + data.message.substring(1, data.message.length);
	}*/
	// Répondre à la question de l'utilisateur
	else {
		var message = neuralNetwork.response(myReseau.perceptron_after_learn, maRecherche, dataIntent);
		lastMessage = data.message;
	}

	socket.emit('message', formatResponse(message, data));
})

console.log("ok");
server.listen(3000);





// Ajouter des données personnalisées
function formatResponse(originalMessage, data, escapeChar = '^') {
	if(originalMessage.includes(escapeChar)) {
		var code = originalMessage.split(escapeChar)[1];
		var replaceValue = "";

		switch(code) {
			case "name":
				replaceValue = data.pseudo;
				break;
			case "time":
				var now = new Date();
				var minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
				replaceValue = now.getHours() + ':' + minutes;
				break;
			case "day":
				break;
			default:
				replaceValue = "??";
		}
		return originalMessage.replace(escapeChar+code+escapeChar, replaceValue);
	}
	return originalMessage;
}

// Insérer des Réponses/Questions dans la base MongoDB de l'IA (sa "mémoire")
function insertIntoDB(choice, message, isQuestion = false) {
	client.connect((err, client) => {
		if(err) throw err;
		var db = client.db('ia');
		
		var query = { "tag": dataIntent["intents"][parseInt(choice) - 1].tag };
		query[isQuestion ? "responses" : "patterns"] = sanitize(ent.decode(message));

		var insert = {};
		insert[isQuestion ? "responses" : "patterns"] = sanitize(ent.decode(message));
		
		db.collection('data').findOne(query, (err, result) => {
			if(err) throw err;
			if(result === null) {
				db.collection('data').updateOne(
				{ 
					"tag": dataIntent["intents"][parseInt(choice) - 1].tag 
				},
				{
					"$push": insert
				}, (err, result) => {
					if(err) throw err;
					console.log('document updated');
				});
			}
		});
	});

	return "Merci pour votre retour !";
}

/*
 *	ICI CODE APPRENTISSAGE
 */
function apprentissage(data) {
	client.connect((err, client) => {
		if(err) throw err;
		const db = client.db("ia");
		db.collection('data').find({}).toArray((err, result) => {
			if(err) throw err;
			dataIntent = {
				"intents": result
			};
	
			console.log("after get data");
			var dataTransform = dataGestion.prepareData(data);
			//console.log(dataTransform);
			console.log("after data transform");
			
			var dataTo01 = dataGestion.prepareTraining(dataTransform[0], dataTransform[1], dataTransform[2], nbIn)
			//console.log(dataTo01)
			
			
			console.log("after data to 01");
			// nb de output = au nobre de tag
			var reseau = neuralNetwork.perceptron(nbIn, nbHidden, dataTransform[1].length);
			
			console.log("after reseau");
			var jsonLearn = neuralNetwork.learn(dataTo01[0], dataTo01[1], reseau, 0.2);
		
			console.log("after learn");
			
			var jsonAfterAdd = {
				"classes": dataTransform[1],
				"words": dataTransform[0],
				"perceptron_after_learn": jsonLearn
			};
			
			fs.writeFile(cheminVersProjet+"rnPractice.json", JSON.stringify(jsonAfterAdd), function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("The file was saved!");
			});
		});
	});
}

/*
 *	FIN CODE APPRENTISSAGE
 */