import { Karami } from "@/server";


const server = new Karami({ port: 3001 });
const testNamespace = server.createNamespace('test');

testNamespace.addHandler({
  name: 'connect',
  method: ({ socket }) => {
    console.log('Connected:', socket.id);
  }
});

testNamespace.addHandler({
  name: 'hello',
  schema: {
    name: { type: 'string', required: true }
  },
  method: ({ success, data }) => {
    success({ message: `Hello, ${data.name}!` });
  }
});

server.start();
