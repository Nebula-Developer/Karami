import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/test', {
  auth: {
    token: 'test'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');

  socket.emit('test', {}, (res) => {
    console.log(res);
  });
});
