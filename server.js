// server.js - Backend WebSocket Server
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('public'));

// Store active users
const users = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user joining
    socket.on('join', (username) => {
        users.set(socket.id, username);
        
        // Notify all clients about new user
        io.emit('user-joined', {
            username: username,
            userId: socket.id,
            timestamp: new Date().toISOString()
        });

        // Send current user list to the new user
        socket.emit('user-list', Array.from(users.values()));

        console.log(`${username} joined the chat`);
    });

    // Handle incoming messages
    socket.on('message', (data) => {
        const username = users.get(socket.id);
        
        if (username) {
            const messageData = {
                username: username,
                message: data.message,
                userId: socket.id,
                timestamp: new Date().toISOString()
            };

            // Broadcast message to all clients
            io.emit('message', messageData);
            console.log(`${username}: ${data.message}`);
        }
    });

    // Handle typing indicator
    socket.on('typing', () => {
        const username = users.get(socket.id);
        if (username) {
            socket.broadcast.emit('user-typing', username);
        }
    });

    socket.on('stop-typing', () => {
        socket.broadcast.emit('user-stop-typing');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        
        if (username) {
            users.delete(socket.id);
            
            // Notify all clients about user leaving
            io.emit('user-left', {
                username: username,
                userId: socket.id,
                timestamp: new Date().toISOString()
            });

            console.log(`${username} left the chat`);
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Chat server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});
