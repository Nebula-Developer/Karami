import { AuthHandler, Namespace } from '../dist';
import { Karami } from '../dist/server';

const server = new Karami({
  port: 3001
});

const authHandler: AuthHandler = async ({ socket }) => {
  return socket.handshake.auth.token === 'test';
};

const testNamespace = new Namespace(
  'test',
  server
);

testNamespace.addAuthHandler(authHandler);

testNamespace.addHandler({
  name: 'test',
  method: async ({ success }) => {
    success('Hello, world!');
  },
  schema: {
    name: 'string'
  }
});

testNamespace.addHandler({
  name: 'connect',
  method: async ({ socket }) => {
    console.log('Got a connection from', socket.id);
  }
});

testNamespace.addHandler({
  name: 'disconnect',
  method: async ({ socket }) => {
    console.log('Got a disconnection from', socket.id);
  }
});

server.start();
