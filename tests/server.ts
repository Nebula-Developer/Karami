import { AuthHandler, Namespace } from '../dist';
import { Karami } from '../dist/server';

var server = new Karami({
  port: 3001,
});


var testNamespace = new Namespace('test', server);

testNamespace.addHandler({
  name: 'test',
  method: async ({ data, success }) => {
    console.log('x')
    success('Hello, world!');
  },
  schema: {
    name: 'string',
  },
});

server.start();
