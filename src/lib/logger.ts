type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, meta?: unknown) {
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  if (meta !== undefined) {
    console[level](`${prefix} ${message}`, meta);
    return;
  }
  console[level](`${prefix} ${message}`);
}

export const logger = {
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta)
};