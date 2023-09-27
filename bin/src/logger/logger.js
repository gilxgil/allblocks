"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const chalk_1 = __importDefault(require("chalk"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["NoPrints"] = 0] = "NoPrints";
    LogLevel[LogLevel["Error"] = 1] = "Error";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Success"] = 3] = "Success";
    LogLevel[LogLevel["Info"] = 4] = "Info";
    LogLevel[LogLevel["Debug"] = 5] = "Debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class LoggerClass {
    constructor() {
        this.logLevel = LogLevel.Error; // default log level is Error
    }
    SetLogLevel(level) {
        if (!level) {
            return;
        }
        if (typeof level === "string") {
            let levelUpperCase = "";
            if (level.length > 0) {
                levelUpperCase = level[0].toUpperCase() + level.slice(1); // debug -> Debug to match enum keys
            }
            const enumLogLevel = LogLevel[levelUpperCase];
            if (enumLogLevel !== undefined) {
                this.logLevel = enumLogLevel;
            }
            else {
                console.log("Failed Setting LogLevel unknown key", level);
            }
        }
        else {
            this.logLevel = level;
        }
    }
    debug(message, ...optionalParams) {
        if (this.logLevel >= LogLevel.Debug) {
            console.log(chalk_1.default.cyan("[Debug]", message, optionalParams));
        }
    }
    info(message, ...optionalParams) {
        if (this.logLevel >= LogLevel.Info) {
            console.log(chalk_1.default.white("[Info]", message, ...optionalParams));
        }
    }
    success(message, ...optionalParams) {
        if (this.logLevel >= LogLevel.Success) {
            console.log(chalk_1.default.green("[Success]", message, ...optionalParams));
        }
    }
    warn(message, ...optionalParams) {
        if (this.logLevel >= LogLevel.Warn) {
            console.log(chalk_1.default.yellow("[Warning]", message, ...optionalParams));
        }
    }
    error(message, ...optionalParams) {
        if (this.logLevel >= LogLevel.Error) {
            console.log(chalk_1.default.red("[Error]", message, ...optionalParams));
        }
    }
    fatal(message, ...optionalParams) {
        return new Error(chalk_1.default.red("[Error]", message, ...optionalParams));
    }
    emptyLine() {
        console.log();
    }
}
exports.Logger = new LoggerClass();
