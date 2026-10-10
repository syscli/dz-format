/** Why a value was rejected. */
export type Reason =
  /** Nothing left after removing spaces and separators. */
  | "empty"
  /** Contains something other than digits and the usual separators. */
  | "chars"
  /** Wrong number of digits. */
  | "length"
  /** Starts with a prefix that this format does not use. */
  | "prefix"
  /** The check key does not match the rest of the number. */
  | "key"
  /** A part of the number is outside its allowed range. */
  | "range"
  /** No wilaya or commune has this name or code. */
  | "unknown"
  /** Several communes have this name; give the wilaya to choose. */
  | "ambiguous"
  /** Does not follow any known written layout. */
  | "format";

export type Invalid = {
  valid: false;
  reason: Reason;
  /** For "unknown" and "ambiguous" places: the closest names, best first. */
  suggestions?: string[];
};

/** Either the parsed parts of a valid value, or the reason it is invalid. */
export type Result<T> = ({ valid: true } & T) | Invalid;

export function fail(reason: Reason): Invalid {
  return { valid: false, reason };
}
