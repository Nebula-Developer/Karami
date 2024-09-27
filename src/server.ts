import { Server } from 'socket.io';
import { Handler } from './types/handlers';
import { Server as HttpServer } from 'http';

/** Config that is used to initialize a new {@link Karami} instance. */
export type ServerConfig = {
  /**
   * The port that the server should listen on
   * @default 3000
   */
  port?: number;

  /**
   * The host that the server should listen on
   * @default localhost
   */
  host?: string;

  /**
   * A list of handlers that will be added to the server upon initialization
   * @default []
   */
  handlers?: Handler[];
};

/** Maps default config for any undefined values in the provided
 * {@link ServerConfig}. */
export function mapDefaultConfig(
  config: ServerConfig
): ServerConfig {
  return {
    port: config.port || 3000,
    host: config.host || 'localhost',
    handlers: config.handlers || []
  };
}

/**
 * A server that hosts a `socket.io` server, and manages the routing of incoming
 * requests through {@link Handler}s.
 */
export class Karami {
  /** The `socket.io` server instance */
  io: Server;

  /** The http server instance */
  httpServer: HttpServer;

  /** The handlers that are registered with the server */
  public handlers: Handler[];

  /** The configuration for the server */
  public config: ServerConfig;

  /**
   * Initializes a new {@link Karami} instance.
   * @param config The configuration for the new instance
   */
  constructor(config: ServerConfig = {}) {
    this.config = mapDefaultConfig(config);
    this.httpServer = new HttpServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: '*'
      }
    });
    this.handlers = this.config.handlers || [];
  }

  /** Starts the server, and listens on the specified port and host. */
  start() {
    this.httpServer.listen(
      this.config.port,
      this.config.host,
      () => {
        console.log(
          `Server running at http://${this.config.host}:${this.config.port}/`
        );
      }
    );
  }
}

export const testServer = new Server();
