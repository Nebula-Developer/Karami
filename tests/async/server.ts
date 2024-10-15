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
  method: async ({ socket }) => {
    logger.log('Connect start', socket.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    (socket as any).specialVariable = 123;
    logger.log('Connect end', socket.id);
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
