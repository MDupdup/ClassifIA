var app = require('express')(),
    server = require('http').createServer(app);

var socket = require('socket.io-client')('http://10.10.20.70:8080');
const fs = require('fs');
const ent = require('ent');
const sanitize = require('mongo-sanitize');
const MongoClient = require('mongodb').MongoClient;


//console.log("Debut");

//var cheminVersProjet = "C:/Users/nicol/Desktop/Nouveau dossier/learningTextClassifIA/chatbot neural n/";
// E:/Users/nicolas.vivion/Desktop/neuralnetwork_js/chatbot neural n/
var cheminVersProjet = "E:/Innovation/IA/learningTextClassifIA/chatbot neural n/";
var nbIn = 250;
var nbHidden = 5;


var	dataGestion = require('./dataGestion');
var neuralNetwork = require('./neuralNetwork');



var dataIntent; //= JSON.parse(fs.readFileSync(cheminVersProjet+'data.json', 'utf8'));

const client = new MongoClient('mongodb://10.10.20.70:27017');

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

var myReseau = JSON.parse(fs.readFileSync(cheminVersProjet+'rnPractice.json', 'utf8'));

var lastMessage;

socket.on('message', function(data) {

	console.log("here")
	var maRecherche = dataGestion.sentenceToArrayBit(myReseau.words, data.message, nbIn);

	// Insérer le dernier message dans la base pour agrandir les connaissances de l'IA
	if(!isNaN(data.message) && data.message > 0 && data.message < dataIntent["intents"].length) {
		client.connect((err, client) => {
			if(err) throw err;
			var db = client.db('ia');
			
			db.collection('data').findOne({ "tag": dataIntent["intents"][parseInt(data.message) - 1].tag, "patterns": lastMessage }, (err, result) => {
				if(err) throw err;
				if(result === null) {
					db.collection('data').updateOne(
					{ 
						"tag": dataIntent["intents"][parseInt(data.message) - 1].tag 
					},
					{
						"$push": { "patterns": sanitize(ent.decode(lastMessage)) }
					}, (err, result) => {
						if(err) throw err;
						console.log('document updated');
					});
				}
			});
		});
		var message = "Merci pour votre retour !";
	} else {
		var message = neuralNetwork.response(myReseau.perceptron_after_learn, maRecherche, dataIntent);
		lastMessage = data.message;
	}

	// Ajouter des données personnalisées
	if(message.includes('^')) {
		var code = message.split('^')[1];
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
		message = message.replace('^'+code+'^', replaceValue);
	}
	socket.emit('message', message);
})

console.log("ok")
server.listen(3000);




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