'use strict';


const synaptic = require('synaptic'); // this line is not needed in the browser
const Layer = synaptic.Layer,
	Network = synaptic.Network;



exports.perceptron = function(input, hidden, output){
	// create the layers
	var inputLayer = new Layer(input);
	var hiddenLayer = new Layer(hidden);
	var outputLayer = new Layer(output);

	// connect the layers
	inputLayer.project(hiddenLayer);
	hiddenLayer.project(outputLayer);

	return new Network({
		input: inputLayer,
		hidden: [hiddenLayer],
		output: outputLayer
	});
}


exports.learn = function(wordsBag, outputs, myNetwork, learningRate){
	//console.log(" learn Debut");
	for (var j = 0; j < 200; j++) {
	//console.log(" learn "+j);
		wordsBag.forEach( function(element, i) {
			myNetwork.activate(element);
			myNetwork.propagate(learningRate, outputs[i]);
		});
	}
	//console.log(myNetwork.activate(wordsBag[0]))
	//console.log(" learn fin");
	return myNetwork.toJSON();
}

exports.classify = function(myReseau, element){
	let myNetwork = Network.fromJSON(myReseau);
	return myNetwork.activate(element);
}


exports.response = function(myReseau, element, dataJson){
	let myNetwork = Network.fromJSON(myReseau);
	let result = myNetwork.activate(element);
	console.log(dataJson.intents.length);
	console.log(result);
	// Réponse par défaut en cas de faibles résultats
	if(Math.max(...result) < 0.15) return "Désolé, je n'ai pas compris votre demande.";
	let intent = dataJson.intents[result.indexOf(Math.max(...result))];
	let responses = intent.responses;
	return responses[Math.floor(Math.random()*responses.length)];
}