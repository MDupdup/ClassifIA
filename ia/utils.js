// Ajouter des données personnalisées
exports.formatResponse = function(originalMessage, data, escapeChar = '^') {
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