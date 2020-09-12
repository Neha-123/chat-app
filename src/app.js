const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { generateMessage, generateLocationMessages } = require('./utils/messages');
const {  addUser, removeUser, getUser, getUsersInRoom } = require('./utils/user')
const socketio = require('socket.io');
const Filter = require('bad-words')

const app =  express();
const server = createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const homedirectorypath = path.join(__dirname, '../public');
app.use(express.static(homedirectorypath));

let count = 0
io.on('connection', (socket) => { //this will fire whenever a new connection happens
    console.log('WebSocket connection')

    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({id: socket.id, username, room});
        if(!user) {
            return callback(user)
        }
        socket.join(user.room);
        socket.emit('message', generateMessage(`Welcome ${user.username}`, 'Admin'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            userList: getUsersInRoom(user.room)
        })
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, 'Admin'))
        callback()
    })

    socket.on('sendMessage' , (message, callback) => {
        const filter = new Filter();
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        const user = getUser(socket.id);
        io.to(user.room).emit('message', generateMessage(message, user.username));
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessages(`https://google.com/maps?q=${location.latitude},${location.longitude}`, user.username))
        callback('Location is shared!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} just left!`, 'Admin'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                userList: getUsersInRoom(user.room)
            })
            
            
        }
        
    })
})
server.listen(port, ()=>{
    console.log('server is up at port '+ port)
})