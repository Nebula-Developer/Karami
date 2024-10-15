import { AuthHandler, Karami, logger } from '@/index';

const server = new Karami({
  port: 3001,
  useHttpServer: false,
  onStart: () => {
    logger.log('Server started on port 3001!');
  }
});

const testNamespace = server.createNamespace(
  'test'
);

const specialAuth: AuthHandler = async ({ socket }) => {
  return (socket as any).specialVariable === 123;
};

testNamespace.addHandler({
  name: 'connect',
  method: ({ socket }) => {
    logger.log('(1) Set special variable to undefined:', socket.id);
    (socket as any).specialVariable = undefined;
  }
});

testNamespace.addHandler({
  name: 'connect',
  method: ({ socket }) => {
    logger.log('(2) Set special variable to 123:', socket.id);
    (socket as any).specialVariable = 123;
  }
});

testNamespace.addHandler({
  name: 'auth',
  method: ({ success, socket }) => {
    success({ specialVariable: (socket as any).specialVariable });
  },
  auth: [specialAuth]
});

server.start();
