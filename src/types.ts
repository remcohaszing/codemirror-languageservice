/**
 * Either a {@link PromiseLike} or the synchronous value.
 *
 * @template T
 * The type to make promise-like.
 */
export type Promisable<T> = PromiseLike<T> | T

/**
 * A {@link Promisable} variant of the given type or null or undefined.
 *
 * @template T
 * The regular result type to expect.
 */
export type LSPResult<T> = Promisable<T | null | undefined | void>
