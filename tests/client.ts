import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/test');

socket.emit('hello', { name: 'world' }, (res: any) => {
  console.log(res);
});
