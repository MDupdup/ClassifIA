var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    MongoClient = require('mongodb').MongoClient,
    ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('nouveau_client', pseudo);
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
        message = isNaN(message) ? ent.encode(message) : message;
        socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
    });

    
    // MongoDB
    const client = new MongoClient('mongodb://10.10.20.70:27017');

    client.connect((err, client) => {
        if(err) throw err;
        const db = client.db("ia");
        db.collection('data').find({}).toArray((err, result) => {
            if(err) throw err;
            socket.emit('list_tags', result);
        });
    });

    // Transmission vers le serveur de l'IA (activation du bouton "Réfléchir")
    socket.on('updateNN', function (update) {
        socket.broadcast.emit('updateNN', update);
    });
});

server.listen(8080);
