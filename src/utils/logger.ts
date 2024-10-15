import emoji from "./emoji";

/**
 * RGB color type for use with true color terminal output.
 */
export type Color = [number, number, number];

/**
 * Colors a string with an RGB color. (True color)
 * @param str The string to color.
 * @param color The color to use.
 * @returns The colored string.
 */
export function colorString(str: string, color: Color) {
  return `\x1b[38;2;${color[0]};${color[1]};${color[2]}m${str}\x1b[0m`;
}

/**
 * Logs a formatted message to the console.
 * @param level The level of the message.
 * @param message The message to log.
 * @param bracketColor The color of the brackets around the level.
 */
function logFormatted(
  level: string,
  message: string,
  bracketColor: Color = [255, 255, 255],
) {
  const time = colorString(
    "[" +
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
      }) +
      "]",
    [50, 100, 100],
  );

  console.log(
    time +
      " " +
      colorString("[", bracketColor) +
      level +
      colorString("] ", bracketColor) +
      message,
  );
}

/**
 * Joins arguments into a single string, formatting objects as JSON.
 * @param args The arguments to join.
 * @param color The color to use for string arguments.
 * @returns The joined string.
 */
export function joinArgs(args: any[], color: Color) {
  return args
    .map((arg) => {
      const last = args.indexOf(arg) === args.length - 1;
      const lastSpace = last ? "" : " ";
      const lastNewline = last ? "" : "\n";
      switch (typeof arg) {
        case "object": {
          const stringifySL = JSON.stringify(arg);
          if (stringifySL.length > 100)
            return (
              "\n" +
              colorString(JSON.stringify(arg, null, 2), [100, 200, 255]) +
              lastNewline
            );
          else return colorString(stringifySL, [100, 200, 255]) + lastSpace;
        }
        case "boolean":
          return colorString(arg.toString(), [230, 100, 250]) + lastSpace;
        case "number":
        case "bigint":
          return colorString(arg.toString(), [100, 200, 200]) + lastSpace;
        case "function":
          return colorString("[Function]", [150, 200, 200]) + lastSpace;
        case "undefined":
          return colorString("undefined", [150, 150, 200]) + lastSpace;
      }

      arg = formatString(arg);

      return colorString(arg, color) + lastSpace;
    })
    .join("");
}

/**
 * Refines an object or array to only contain the specified attributes.
 * @param obj The object or array to refine.
 * @param attributes The attributes to keep.
 * @param exclude The attributes to exclude.
 * @returns The refined object or array.
 * @example attributeObject({ hello: 123, world: 456 }, ["hello"]) => { hello: 123 }
 * @example attributeObject({ hello: { value: 123 }, world: ...}, ["hello.value"]) => { hello: { value: 123 } }
 * @example attributeObject({ hello: 123, world: 456 }, null, ["world"]) => { hello: 123 }
 * @example attributeObject({ test: [{ hello: 123, world: 456 }] }, ["test.hello"]) => { test: [{ hello: 123 }] }
 */
export function attributeObject(
  obj: { [key: string]: any } | any[],
  attributes?: string[] | null,
  exclude?: string[] | null,
): { [key: string]: any } | any[] {
  let newObj: { [key: string]: any } = Array.isArray(obj) ? [] : {};

  const attributeInlineObject = (
    obj: any,
    attributes: string[] | null,
  ): any => {
    if (Array.isArray(obj)) {
      const newArray = [];
      for (const item of obj) {
        newArray.push(attributeInlineObject(item, attributes));
      }
      return newArray;
    } else if (typeof obj === "object") {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (!attributes) continue;

        if (attributes.length === 0) {
          newObj[key] = obj[key];
          continue;
        }

        if (!attributes.map((a) => a.split(".")[0]).includes(key)) continue;

        const attribNew = attributes!
          .filter((a) => a.startsWith(key + "."))
          .map((a) => a.slice(key.length + 1));

        newObj[key] = attributeInlineObject(obj[key], attribNew);
      }
      return newObj;
    } else {
      return obj;
    }
  };

  const excludeInlineObject = (obj: any, exclude: string[]): any => {
    if (Array.isArray(obj)) {
      const newArray = [];
      for (const item of obj) {
        newArray.push(excludeInlineObject(item, exclude));
      }
      return newArray;
    } else if (typeof obj === "object") {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (exclude.includes(key)) continue;
        newObj[key] = excludeInlineObject(obj[key], exclude);
      }
      return newObj;
    } else {
      return obj;
    }
  };

  if (attributes) newObj = attributeInlineObject(obj, attributes);
  else newObj = Object.assign(newObj, obj);
  return exclude ? excludeInlineObject(newObj, exclude) : newObj;
}

/**
 * Formats a string with emoji.
 * @param str The string to format.
 * @returns The formatted string.
 */
export function formatString(str: string): string {
  return str.replace(
    /:([a-zA-Z0-9_]+):/g,
    (match: string, emojiName: string) => {
      return emoji[emojiName] || match;
    },
  );
}

/**
 * Measures a string with emoji.
 * @param str The string to measure.
 * @returns The measured string.
 */
export function measureString(str: string): number {
  return str.replace(/:[a-zA-Z0-9_]+:/g, "  ").length;
}

/**
 * A static logger instance that formats and logs messages to the console.
 */
export const logger = {
  /** Logs a message with the INFO level. */
  info: (...args: any[]) => {
    logFormatted(
      colorString("INFO", [0, 255, 0]),
      joinArgs(args, [200, 250, 200]),
    );
  },
  /** Alias for info method. Logs a message with the INFO level. */
  log: (...args: any[]) => {
    logger.info(...args);
  },
  /** Logs a message with the DEBUG level. */
  debug: (...args: any[]) => {
    logFormatted(
      colorString("DEBUG", [120, 120, 120]),
      joinArgs(args, [100, 100, 100]),
      [100, 100, 100],
    );
  },
  /** Logs a message with the WARN level. */
  warn: (...args: any[]) => {
    logFormatted(
      colorString("WARN", [255, 255, 0]),
      joinArgs(args, [255, 255, 0]),
      [150, 200, 10],
    );
  },
  /** Logs a message with the ERROR level. */
  error: (...args: any[]) => {
    logFormatted(
      colorString("ERROR", [250, 50, 50]),
      joinArgs(args, [255, 150, 150]),
      [250, 50, 50],
    );
  },
  /** Just for special prints, like a CLI banner, eg */
  system: (...args: any[]) => {
    logFormatted(
      colorString("SYSTEM", [230, 150, 255]),
      joinArgs(args, [255, 130, 255]),
      [255, 200, 255],
    );
  },
  /** Clears the console. */
  clear: () => {
    console.clear();
  },
};

logger.debug("Logger initialized :magic:");

export default logger;
