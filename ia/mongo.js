const sanitize = require('mongo-sanitize');
const MongoClient = require('mongodb').MongoClient;

let client;
let url;
const dbName = 'ia';
const collectionName = 'data';

exports.setURL = function(uri) {
    url = uri;
}

function openConnection(callback = undefined) {
    
    if(client === undefined) client = new MongoClient(url);
    var coll = client.db(dbName).collection(collectionName);
    return coll;
}

exports.findInDB = function() {
    return openConnection().find({}).toArray();
        //if(err) throw err;
        //dataIntent = { "intents": result };

        //return dataIntent;
        // Fonction d'apprentissage du réseau de neurones, à lancer uniquement pour rafraîchir
        // le réseau avec les données de la base nouvellement enregistrées
        //apprentissage(dataIntent);
    //});
}

exports.insertInDB = function(choice, message, isQuestion = false) {
	client.connect((err, client) => {
		if(err) throw err;
		var db = client.db(dbName);
		
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