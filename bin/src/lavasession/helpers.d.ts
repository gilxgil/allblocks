export declare type ErrorResult<T, E extends Error = Error> = {
    error: E;
} & Partial<T>;
export declare type SuccessResult<T> = T & {
    error?: undefined;
};
export declare type Result<T = unknown, E extends Error = Error> = SuccessResult<T> | ErrorResult<T, E>;
