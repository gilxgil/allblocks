export declare enum LogLevel {
    NoPrints = 0,
    Error = 1,
    Warn = 2,
    Success = 3,
    Info = 4,
    Debug = 5
}
declare class LoggerClass {
    private logLevel;
    SetLogLevel(level: LogLevel | string | undefined): void;
    debug(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    success(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
    fatal(message?: any, ...optionalParams: any[]): Error;
    emptyLine(): void;
}
export declare const Logger: LoggerClass;
export {};
