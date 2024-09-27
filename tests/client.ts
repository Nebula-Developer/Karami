import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/test', {
  auth: {
    token: 'secrets'
  }
});

socket.emit('hello', { name: 'world' }, (res: any) => {
  console.log(res);
});

socket.emit('test', {}, (res: any) => {
  console.log(res);
});
