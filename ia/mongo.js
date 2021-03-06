const sanitize = require('mongo-sanitize');
const MongoClient = require('mongodb').MongoClient;
const ent = require('ent');
var ObjectID = require('mongodb').ObjectID;

let client;
let url;
const dbName = 'ia';
const collectionName = 'data';

exports.setURL = (uri) => {
    url = uri;
}

function openConnection() {
	return new Promise((res, rej) => {
		if(client === undefined) client = new MongoClient(url);
		res(client);
	}).catch(e => console.error(e));
}

exports.findInDB = (collection) => {
	return new Promise((res, rej) => {
		openConnection().then(client => {
			client.connect((err, client) => {
				if(err) throw err;
				client.db(dbName).collection(collection).find({}).toArray((err, result) => {
					res(result);
				});
			});
		}).catch(e => {
			rej(e);
		});
	});
}


exports.updateNNConfig = (data, collection = "config") => {
	openConnection().then(client => {
		client.connect((err, client) => {
			if(err) throw err;
			client.db(dbName).collection(collection).findOneAndUpdate({ "_id": ObjectID("5c419032ae5f3055b58d9918") }, {data}, 
			(err, res) => {
				if(err) throw err;
				console.log('Brain data updated');
			});
		});
	});
}

// Insérer des Réponses/Questions dans la base MongoDB de l'IA (sa "mémoire")
exports.fillDB = (choice, message, dataIntent, isQuestion = false) => {
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