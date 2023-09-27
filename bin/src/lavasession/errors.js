"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotLockedError = exports.AlreadyLockedError = exports.SendRelayError = exports.MaximumNumberOfBlockListedSessionsError = exports.SessionOutOfSyncError = exports.BlockProviderError = exports.ReportAndBlockProviderError = exports.NegativeComputeUnitsAmountError = exports.SessionIsAlreadyBlockListedError = exports.AddressIndexWasNotFoundError = exports.EpochMismatchError = exports.MaxComputeUnitsExceededError = exports.MaximumNumberOfSessionsExceededError = exports.AllProviderEndpointsDisabledError = exports.UnreachableCodeError = exports.PairingListEmptyError = void 0;
// consumer errors
class PairingListEmptyError extends Error {
    constructor() {
        super("Pairing list is empty");
    }
}
exports.PairingListEmptyError = PairingListEmptyError;
class UnreachableCodeError extends Error {
    constructor() {
        super("Unreachable code");
    }
}
exports.UnreachableCodeError = UnreachableCodeError;
class AllProviderEndpointsDisabledError extends Error {
    constructor() {
        super("All provider endpoints are disabled");
    }
}
exports.AllProviderEndpointsDisabledError = AllProviderEndpointsDisabledError;
class MaximumNumberOfSessionsExceededError extends Error {
    constructor() {
        super("Maximum number of sessions exceeded");
    }
}
exports.MaximumNumberOfSessionsExceededError = MaximumNumberOfSessionsExceededError;
class MaxComputeUnitsExceededError extends Error {
    constructor() {
        super("Maximum compute units exceeded");
    }
}
exports.MaxComputeUnitsExceededError = MaxComputeUnitsExceededError;
class EpochMismatchError extends Error {
    constructor() {
        super("Epoch mismatch");
    }
}
exports.EpochMismatchError = EpochMismatchError;
class AddressIndexWasNotFoundError extends Error {
    constructor() {
        super("Address index was not found");
    }
}
exports.AddressIndexWasNotFoundError = AddressIndexWasNotFoundError;
class SessionIsAlreadyBlockListedError extends Error {
    constructor() {
        super("Session is already block listed");
    }
}
exports.SessionIsAlreadyBlockListedError = SessionIsAlreadyBlockListedError;
class NegativeComputeUnitsAmountError extends Error {
    constructor() {
        super("Negative compute units amount");
    }
}
exports.NegativeComputeUnitsAmountError = NegativeComputeUnitsAmountError;
class ReportAndBlockProviderError extends Error {
    constructor() {
        super("Report and block provider error");
    }
}
exports.ReportAndBlockProviderError = ReportAndBlockProviderError;
class BlockProviderError extends Error {
    constructor() {
        super("Block provider error");
    }
}
exports.BlockProviderError = BlockProviderError;
class SessionOutOfSyncError extends Error {
    constructor() {
        super("Session out of sync");
    }
}
exports.SessionOutOfSyncError = SessionOutOfSyncError;
class MaximumNumberOfBlockListedSessionsError extends Error {
    constructor() {
        super("Maximum number of block listed sessions exceeded");
    }
}
exports.MaximumNumberOfBlockListedSessionsError = MaximumNumberOfBlockListedSessionsError;
class SendRelayError extends Error {
    constructor() {
        super("Send relay error");
    }
}
exports.SendRelayError = SendRelayError;
class AlreadyLockedError extends Error {
    constructor() {
        super("Already locked");
    }
}
exports.AlreadyLockedError = AlreadyLockedError;
class NotLockedError extends Error {
    constructor() {
        super("Not locked");
    }
}
exports.NotLockedError = NotLockedError;
