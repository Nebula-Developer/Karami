import { Karami } from "./server";
import { AuthHandler, Handler } from "./types/handlers";
import { Namespace as IONamespace, Socket } from "socket.io";

/**
 * A namespace within a {@link Karami} server.
 */
export class Namespace {
  /** The name of the namespace */
  name: string;

  /** The handlers that are registered with the namespace */
  handlers: Handler[] = [];
  
  /** The authentication handlers that are registered with the entire namespace */
  authHandlers: AuthHandler[] = [];

  /** The {@link Karami} server that the namespace is attached to */
  server: Karami;

  /** The `socket.io` Namespace that this namespace is attached to */
  io: IONamespace;

  /**
   * Initializes a new {@link Namespace} instance.
   * @param name The name of the namespace
   * @param server The {@link Karami} server that the namespace is attached to
   */
  constructor(name: string, server: Karami) {
    this.name = name;
    this.server = server;
    this.io = server.io.of(name);
    this.io.on('connection', this.onConnection.bind(this));
  }

  /**
   * Handles a new socket connection to the server.
   * @param socket The socket that connected to the server
   */
  private onConnection(socket: Socket) {
    if (!this.checkNamespaceAuth(socket))
      return this.unauthorizeAll();

    this.applyHandlers(socket);
  }

  /**
   * Checks all {@link AuthHandler}s for the given socket and {@link Handler}.
   * @param socket The socket to check the authentication for
   * @param handler The handler to check the authentication for
   * @returns Whether the socket is authorized to access the handler
   */
  private async checkAuth(socket: Socket, handler: Handler) {
    if (!handler.auth) return true;
    for (let auth of handler.auth) {
      if (!(await auth({ socket, namespace: this.name, handler: handler.name }))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks all namespace-wide {@link AuthHandler}s for the given socket.
   * @param socket The socket to check the authentication for
   * @returns Whether the socket is authorized to access the namespace
   */
  private async checkNamespaceAuth(socket: Socket) {
    for (let auth of this.authHandlers) {
      if (!(await auth({ socket, namespace: this.name }))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Handles an unauthorized request to a socket.
   * @param socket The socket that the request was made on
   * @param handler The name of the handler that was unauthorized
   */
  private unauthorized(socket: Socket, handler: string) {
    socket.on(handler, (data, callback) => {
      if (!callback || typeof callback !== 'function') return;
      callback({ success: false, error: 'Unauthorized' });
    });
  }

  /**
   * Unauthorizes all handlers in the namespace.
   */
  private unauthorizeAll() {
    this.io.use((socket, next) => {
      socket.onAny((data, callback) => {
        if (!callback || typeof callback !== 'function') return;
        callback({ success: false, error: 'Unauthorized' });
      });
    });
  }

  /**
   * Verifies that a socket has provided correct data for a handler.
   * @param data The provided data
   * @param callback The provided callback
   * @param schema The schema to verify the data against
   * @returns Whether the data is valid
   */
  private verifyData(data: any, callback: any, schema: any) {
    if (!callback || typeof callback !== 'function') return false;

    if (!data || typeof data !== 'object') {
      callback({ success: false, error: 'Provided data is not an object (got ' + typeof data + ')' });
      return false;
    }

    if (!schema) return true;

    for (let key in schema) {
      if (data[key] == null || data[key] == undefined) {
        callback({ success: false, error: `Missing required field: ${key}` });
        return false;
      }

      if (schema[key] !== 'any' && typeof data[key] !== schema[key]) {
        callback({ success: false, error: `Invalid type for field ${key}: ${typeof data[key]} (expected ${schema[key]})` });
        return false;
      }
    }
    
    return true;
  }

  /**
   * Applies all registered handlers to a socket.
   * @param socket The socket to apply the handlers to
   */
  applyHandlers(socket: Socket) {
    this.handlers.forEach(async (handler) => {
      // check authentication
      if (!(await this.checkAuth(socket, handler)))
        return this.unauthorized(socket, handler.name);

      socket.on(handler.name, (data, callback) => {
        if (!this.verifyData(data, callback, handler.schema)) return;

        console.log('Handling', handler.name);
        handler.method({
          data,
          success: (data) => callback({ success: true, data }),
          error: (error) => callback({ success: false, error }),
          callback,
          socket
        });
      });
    });
  }

  /**
   * Adds a new handler to the namespace.
   * @param handler The handler to add to the namespace
   */
  addHandler(handler: Handler) {
    this.handlers.push(handler);
  }
};
