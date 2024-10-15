import { Server, ServerOptions } from 'socket.io';
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
   * @default "localhost"
   */
  host?: string;

  /**
   * A list of namespaces that will be added to the server upon initialization
   * @default []
   */
  namespaces?: Namespace[];

  /**
   * A method that is called when the server is started
   * @default () => {}
   */
  onStart?: () => void;

  /**
   * A custom `HttpServer` instance that the server should use
   * @default undefined
   */
  httpServer?: HttpServer;

  /**
   * A custom `socket.io` server instance that the server should use
   * @default undefined
   */
  io?: Server;

  /**
   * Configuration to pass to the `socket.io` server instance
   * @default { cors: { origin: '*' } }
   */
  ioConfig?: Partial<ServerOptions>;

  /**
   * Whether to use an HTTP server or not
   *
   * If set to `false`, the server will use the `socket.io` server directly.
   * @default true
   */
  useHttpServer?: boolean;
};

/** Maps default config for any undefined values in the provided
 * {@link ServerConfig}. */
export function mapDefaultConfig(
  config: ServerConfig
): ServerConfig {
  return {
    port: config.port || 3000,
    host: config.host || 'localhost',
    namespaces: config.namespaces || [],
    onStart: config.onStart || (() => {}),
    httpServer: config.httpServer || undefined,
    io: config.io || undefined,
    ioConfig: config.ioConfig || {
      cors: {
        origin: '*'
      }
    },
    useHttpServer: config.useHttpServer ?? true
  };
}

/**
 * A {@link Karami} server, which hosts multiple {@link Namespace} instances.
 * This class is responsible for handling the base server configuration, and
 * delegating the handling of namespaces to the {@link Namespace} class.
 */
export class Karami {
  /** The `socket.io` server instance */
  io: Server;

  /** The http server instance */
  httpServer?: HttpServer;

  /** The configuration for the server */
  private _config: ServerConfig = {};

  set config(config: ServerConfig) {
    if (typeof config !== 'object')
      throw new Error(
        'The provided config is not an object.'
      );
    this._config = mapDefaultConfig(config);
    this._config.namespaces?.forEach(namespace =>
      namespace.load()
    );
  }

  get config() {
    return this._config;
  }

  /**
   * Initializes a new {@link Karami} instance.
   * @param config The configuration for the new instance
   */
  constructor(config: ServerConfig = {}) {
    this.config = config;

    if (this.config.useHttpServer)
      this.httpServer =
        this.config.httpServer ||
        new HttpServer();

    this.io =
      this.config.io ||
      new Server(
        ...([
          this.config.useHttpServer &&
            this.httpServer,
          this.config.ioConfig
        ] as any[])
      );
  }

  /** Starts the server, and listens on the specified port and host. */
  start() {
    if (
      !this.config.useHttpServer ||
      !this.httpServer
    ) {
      this.io.listen(this.config.port ?? 3000);
      this.config.onStart?.();
      return;
    }

    this.httpServer.listen(
      this.config.port,
      this.config.host,
      () => this.config.onStart?.()
    );
  }

  /** Stops the HTTP server. */
  stop() {
    if (
      this.config.useHttpServer &&
      this.httpServer
    )
      this.httpServer.close();
    else this.io.close();
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

export default Karami;
