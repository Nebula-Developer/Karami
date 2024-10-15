import { Karami } from './server';
import {
  AuthHandler,
  Handler,
  HandlerProps
} from './types/handlers';
import {
  Namespace as IONamespace,
  Socket
} from 'socket.io';

/**
 * Empty {@link HandlerProps} for use in special handlers like `connect` and `disconnect`.
 */
const EmptyHandlerProps: HandlerProps = {
  data: {},
  success: () => {},
  error: () => {},
  callback: () => {},
  socket: {} as Socket
};

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

  /** Whether to use pre-connect event caching */
  preConnectCache: boolean = true;

  /**
   * Initializes a new {@link Namespace} instance.
   * @param name The name of the namespace
   * @param server The {@link Karami} server that the namespace is attached to
   */
  constructor(name: string, server: Karami) {
    if (!name)
      throw new Error(
        'A name is required to create a namespace.'
      );

    if (!server)
      throw new Error(
        'A Karami server is required to create a namespace.'
      );

    this.name = name;
    this.server = server;
    this.io = server.io.of(name);
    this.io.on(
      'connection',
      this.onConnection.bind(this)
    );
  }

  /**
   * Handles a new socket connection to the server.
   * @param socket The socket that connected to the server
   */
  private async onConnection(socket: Socket) {
    if (!(await this.checkNamespaceAuth(socket)))
      return this.unauthorizeAll(socket);

    this.applyHandlers(socket);
  }

  /**
   * Checks all {@link AuthHandler}s for the given socket and {@link Handler}.
   * @param socket The socket to check the authentication for
   * @param data The data that was passed to the handler
   * @param handler The handler to check the authentication for
   * @returns Whether the socket is authorized to access the handler
   */
  private async checkAuth(
    socket: Socket,
    handler: Handler
  ) {
    if (!handler.auth) return true;
    for (const auth of handler.auth) {
      if (
        !(await auth({
          socket,
          namespace: this,
          auth: socket.handshake.auth
        }))
      ) {
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
  private async checkNamespaceAuth(
    socket: Socket
  ) {
    for (const auth of this.authHandlers) {
      if (
        !(await auth({
          socket,
          namespace: this,
          auth: socket.handshake.auth
        }))
      ) {
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
  private unauthorized(
    socket: Socket,
    handler: string
  ) {
    socket.on(handler, (data, callback) => {
      if (
        !callback ||
        typeof callback !== 'function'
      )
        return;
      callback({
        success: false,
        error: 'Unauthorized'
      });
    });
  }

  /**
   * Unauthorizes all handlers in the namespace.
   * @param socket The socket to unauthorize
   */
  private unauthorizeAll(socket: Socket) {
    this.handlers.forEach(handler =>
      this.unauthorized(socket, handler.name)
    );
  }

  /**
   * Verifies that a socket has provided correct data for a handler.
   * @param data The provided data
   * @param callback The provided callback
   * @param schema The schema to verify the data against
   * @returns Whether the data is valid
   */
  private verifyData(
    data: any,
    callback: any,
    schema: any
  ) {
    if (
      !callback ||
      typeof callback !== 'function'
    )
      return false;

    if (!data || typeof data !== 'object') {
      callback({
        success: false,
        error: `Provided data is not an object (got '${typeof data}')`
      });
      return false;
    }

    if (!schema) return true;

    for (const key in schema) {
      const rule =
        typeof schema[key] === 'object'
          ? schema[key]
          : { type: schema[key], required: true };

      if (
        (data[key] == null ||
          data[key] == undefined) &&
        rule.required
      ) {
        callback({
          success: false,
          error: `Missing required field: '${key}'`
        });
        return false;
      }

      if (
        data[key] != null &&
        typeof data[key] !== rule.type
      ) {
        callback({
          success: false,
          error: `Invalid type for field '${key}' (expected '${
            rule.type
          }', got '${typeof data[key]}')`
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Iterates through all handlers, checking if the socket is authorized to access them before running the callback.
   * @param handlers The handlers to iterate through
   * @param socket The socket to apply the handlers to
   * @param callback The callback to run for each handler
   */
  async forEachHandler(
    handlers: Handler[],
    socket: Socket,
    callback: (
      handler: Handler
    ) => void | Promise<void>
  ) {
    for (const handler of handlers) {
      if (
        !(await this.checkAuth(socket, handler))
      )
        return this.unauthorized(
          socket,
          handler.name
        );

      await callback(handler);
    }
  }

  /**
   * Applies all registered handlers to a socket.
   * @param socket The socket to apply the handlers to
   */
  async applyHandlers(socket: Socket) {
    const eventCache: any[] = [];
    const eventCacheMethod = (...args: any[]) =>
      eventCache.push(args);
    if (this.preConnectCache)
      socket.onAny(eventCacheMethod);

    const runHandler = async (
      handler: Handler,
      data: any,
      callback: any
    ) => {
      if (
        !this.verifyData(
          data,
          callback,
          handler.schema
        )
      )
        return;

      handler.method({
        data,
        success: data =>
          callback({ success: true, data }),
        error: error =>
          callback({
            success: false,
            error
          }),
        callback,
        socket,
        namespace: this
      });
    };

    await this.forEachHandler(
      this.handlers,
      socket,
      async handler => {
        switch (handler.name) {
          case 'connect':
            await handler.method({
              ...EmptyHandlerProps,
              socket
            });
            break;
          case 'disconnect':
            socket.addListener('disconnect', () =>
              handler.method({
                ...EmptyHandlerProps,
                socket,
                namespace: this
              })
            );
            return;
        }
      }
    );

    socket.offAny(eventCacheMethod);

    await this.forEachHandler(
      this.handlers,
      socket,
      handler => {
        if (
          ['connect', 'disconnect'].includes(
            handler.name
          )
        )
          return;

        if (
          socket.listenerCount(handler.name) > 0
        )
          throw new Error(
            `Handler '${handler.name}' already exists in the namespace '${this.name}'`
          );

        socket.on(
          handler.name,
          (data, callback) =>
            runHandler(handler, data, callback)
        );
      }
    );

    if (this.preConnectCache) {
      eventCache.forEach(async args => {
        for (const handler of this.handlers) {
          if (handler.name === args[0])
            runHandler(handler, args[1], args[2]);
        }
      });
    }
  }

  /**
   * Adds a new handler to the namespace.
   * @param handler The handler to add to the namespace
   */
  addHandler(handler: Handler) {
    this.handlers.push(handler);
  }

  /**
   * Adds a new authentication handler to the namespace.
   * @param handler The authentication handler to add to the namespace
   */
  addAuthHandler(handler: AuthHandler) {
    this.authHandlers.push(handler);
  }

  /**
   * Method to ensure that the namespace has been initialized.
   */
  load() {}
}

export default Namespace;
