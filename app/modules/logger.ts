import pino from "pino";
import pretty from "pino-pretty";

let _logger: pino.Logger | undefined;

const DEFAULT_PRETTY_OPTIONS = {
    colorize: true,
  sync: true,
  messageFormat: "{method}: {msg}",
  hideObject: false,
  ignore: "pid,hostname",
} as const satisfies pretty.PrettyOptions;

export const logFactory = (name: string) => {
  if (_logger) {
    return _logger;
  }

  const prettyStream = pretty(DEFAULT_PRETTY_OPTIONS);

  _logger = pino(
    {
      name,
      formatters: {
        level: (label: string) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    prettyStream
  );
  return _logger;
};