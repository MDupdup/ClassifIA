'use strict';


/**
	{
		"intents": 
		[
			{
				"tag": "greeting",
				"patterns": ["Hi", "How are you", "Is anyone there?", "Hello", "Good day"],
				"responses": ["Hello, thanks for visiting", "Good to see you again", "Hi there, how can I help?"],
				"context_set": ""
			},
			{"tag": "goodbye",
				"patterns": ["Bye", "See you later", "Goodbye"],
				"responses": ["See you later, thanks for visiting", "Have a nice day", "Bye! Come back again soon."]
			}
		]
	}
*/
exports.prepareData = function(data){
	var words = [];
	var classes = [];
	var documents = [];
	var ignore_words = ['?'];
	let training_data = data.intents;
	//  pour tous les intent
	for (var i = 0; i < training_data.length; i++) {
		let patterns = training_data[i].patterns;
		// on lit tous les patterns de chaque intent
		for(var j = 0; j < patterns.length; j++){
			// je l'eclatte en tableau de mots et en lower case
			var wordsTempo = patterns[j].split(' ').map(v => v.toLowerCase());
			// pour tous les mots de la phrase
			for (var e = 0; e < wordsTempo.length; e++) {
				// si diff de '?'
				if(!ignore_words.includes(wordsTempo[e])){
					if(!words.includes(wordsTempo[e])) words.push(wordsTempo[e]);
					if(!classes.includes(training_data[i].tag)) classes.push(training_data[i].tag);
				}
				documents.push([training_data[i].tag, wordsTempo]);
			}
		}
	}
	return [words, classes, documents];
}



exports.prepareTraining = function(words, classes, documents, nbIn){
	var wordsBag = [];
	var output = [];
	for (var i = 0; i < documents.length; i++) {
		let bag = [];
		// recuperations des mots dans le documents
		let pattern_words = documents[i][1];
		words.forEach(function(element) {
			// ici en fonction de TOUT les mots (donc de toutes les phrases) on increment a 1 si un
			// mot de la phrase est detecté
			if(pattern_words.includes(element)){
				bag.push(1);
			}else{
				bag.push(0);
			}
		});
		// ici on fait en sorte que la taille du bag corresponde a celle du nombre d'entre
		for(var j = bag.length; j < nbIn; j++){
			bag.push(0);
		}
		wordsBag.push(bag);
		// ici output_empty = [0,0,0] vu que 3 classes differentes
		// on met a 1 la classes correspondant au document en cours
		let output_empty = []
		for (var u = 0; u < classes.length; u++) {
			output_empty.push(0);
		}
		output_empty[classes.indexOf(documents[i][0])] = 1;
		output.push(output_empty)
	}
	return [wordsBag, output];
}



exports.quelqueClassJeSuis = function(classes, retourActivate){
	retourActivate.forEach( function(element, index) {
		console.log(classes[index] + " "+ element);
	});
}

exports.sentenceToArrayBit = function(words, sentence, nbIn){
	var documents = sentence.split(' ').map(v => v.toLowerCase());
	let bag = [];
	words.forEach(function(element) {
		if(documents.includes(element)){
			bag.push(1);
		}else{
			bag.push(0);
		}
	});
	// ici on fait en sorte que la taille du bag corresponde a celle du nombre d'entre
	for(var j = bag.length; j < nbIn; j++){
		bag.push(0);
	}
	return bag;
}