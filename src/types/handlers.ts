import { Karami } from "@/server";
import { Socket } from "socket.io";
import { Namespace as IONamespace } from "socket.io";

/**
 * The base response passed to a client from a {@link Handler}.
 */
export type HandlerResponse = {
  /** Whether the handler was successful */
  success: boolean;
  /** The data that was returned from the handler, if successful */
  data?: any;
  /** The error that was returned from the handler, if unsuccessful */
  error?: any;
};

/**
 * The callback function that is passed to a {@link Handler} from a client.
 */
export type ClientCallback = (
  /** The response from the {@link Handler} that is passed to the client */
  res: HandlerResponse,
) => void;

/**
 * The schema for the expected data types from the client in a {@link Handler}.
 */
export type DataTypeSchema = {
  /**
   * A key-value pair where the key is the name of the data type.
   * If the data type is a string, the value is implicitly required.
   */
  [key: string]: DataTypeRule | string;
};

/**
 * The rules for a singular data type within a {@link DataTypeSchema}.
 */
export type DataTypeRule = {
  /** The type of the data */
  type: string;
  /** Whether the data is required */
  required: boolean;
};

/**
 * The properties that are passed to a socket handler.
 */
export type HandlerProps = {
  /**
   * The data that was passed from the client to the handler. This data is
   * expected to match the schema of the handler, if one is provided.
   */
  data: { [key: string]: any };
  /**
   * Method called to send a successful response to the client.
   * @param data The data to send to the client.
   */
  success: (data?: any) => void;
  /**
   * Method called to send an error response to the client.
   * @param error The error message to send to the client.
   */
  error: (error: string) => void;
  /**
   * The raw callback function that was passed from the client. This function
   * should be avoided in favor of the {@link success} and {@link error} methods.
   * @param args The arguments to pass to the callback.
   */
  callback: (...args: any[]) => void;
  /**
   * The socket that is being handled.
   */
  socket: Socket;
};

/**
 * A method for handling a socket event
 */
export type HandlerMethod = (
  /** The properties that are passed to a socket handler */
  props: HandlerProps,
) => void;

/**
 * Constructor for producing a socket handler
 */
export type Handler = {
  /** The method that will be called when the handler is triggered */
  method: HandlerMethod;
  /** The name of the handler */
  name: string;
  /** The schema for the expected data types from the client */
  schema?: DataTypeSchema;
  /**
   * A list of {@link AuthHandler}s that will be called before the handler to
   * determine authorization.
   */
  auth?: AuthHandler[];
};

/**
 * Props for an {@link AuthHandler}.
 */
export type AuthHandlerProps = {
  /** The socket that is being authenticated */
  socket: Socket;
  /** The namespace that the socket is attempting to access */
  namespace: string;
  /** The handler that the socket is attempting to access */
  handler?: string;
};

/**
 * An authentication handler that determines whether a client is authorized to
 * access a particular {@link Namespace} or {@link Handler}.
 * 
 * {@link AuthHandler}s are called before the {@link Handler} is executed, and
 * can also act as a middleware for the {@link Namespace}.
 */
export type AuthHandler = (props: AuthHandlerProps) => Promise<boolean>;
