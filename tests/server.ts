import { Namespace } from '../dist';
import { Karami } from '../dist/server';

const server = new Karami({
  port: 3001
});

const testNamespace = new Namespace(
  'test',
  server
);

testNamespace.addHandler({
  name: 'test',
  method: async ({ success }) => {
    console.log('x');
    success('Hello, world!');
  },
  schema: {
    name: 'string'
  }
});

server.start();
