import { Karami } from '@/index';

const server = new Karami({ port: 3001 });
const testNamespace = server.createNamespace(
  'test'
);

testNamespace.addHandler({
  name: 'connect',
  method: ({ socket }) => {
    console.log('Connected:', socket.id);
  }
});

testNamespace.addHandler({
  name: 'hello',
  schema: { name: 'string' },
  method: ({ success, data }) => {
    success({ message: `Hello, ${data.name}!` });
  },
  auth: [
    async ({ auth }) => auth.token === 'secret'
  ]
});

testNamespace.addHandler({
  name: 'test',
  method: ({ success }) => {
    success({ message: 'Test successful!' });
  }
});

server.start();
