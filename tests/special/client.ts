import { logger } from '@/index';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/test', {
  auth: { token: 'secret' }
});

socket.emit('auth', {}, (res: any) => {
  logger.log(res);
});
