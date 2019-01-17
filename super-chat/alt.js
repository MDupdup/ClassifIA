const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = {};

io.on('connection', socket => {
    console.log('user connected: ', socket.id);
    users[socket.id] = 'anon';

    socket.on('loaded', (data) => {
        console.log('data from client :', data);
    });

    socket.on('message', (data) => {
        if(data.sender != null)
        {   
            console.log('this is a private message sent to ', users[data.sender]);
            socket.broadcast.to(data.sender).emit('message', data);
        }
        else
        {
            console.log('this is a broadcast message');
            socket.broadcast.emit('message', data);
        }
        
    });

    socket.on('username', (nick) => {
        users[socket.id] = nick;
        io.emit('users', users);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
    })

    io.emit('users', users);
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

http.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});