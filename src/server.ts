import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Namespace } from './namespace';

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
   * A list of namespaces that will be added to the server upon initialization
   * @default []
   */
  namespaces?: Namespace[];
};

/** Maps default config for any undefined values in the provided
 * {@link ServerConfig}. */
export function mapDefaultConfig(
  config: ServerConfig
): ServerConfig {
  return {
    port: config.port || 3000,
    host: config.host || 'localhost',
    namespaces: config.namespaces || []
  };
}

/**
 * A server that hosts a `socket.io` server, and hosts multiple namespaces under
 * a single server instance.
 */
export class Karami {
  /** The `socket.io` server instance */
  io: Server;

  /** The http server instance */
  httpServer: HttpServer;

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
    
    this.config.namespaces?.forEach((namespace) => {
      namespace.load();
    });
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

  /**
   * Creates a new namespace for this server.
   * @param name The name of the new namespace
   * @returns The new namespace
   */
  createNamespace(name: string) {
    const namespace = new Namespace(name, this);
    namespace.load();
    return namespace;
  }
}

export const testServer = new Server();
