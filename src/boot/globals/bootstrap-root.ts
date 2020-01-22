/**
 * @packageDocumentation
 * @module @wesib/wesib
 */
import { SingleContextKey, SingleContextRef } from 'context-values';
import { BootstrapWindow } from './bootstrap-window';

/**
 * A window (e.g. DOM) element all bootstrapped components belong to.
 *
 * @category Core
 */
export type BootstrapRoot = any;

/**
 * A key of bootstrap context value containing a bootstrap root.
 *
 * Target value defaults to document body of [[BootstrapWindow]].
 *
 * @category Core
 */
export const BootstrapRoot: SingleContextRef<BootstrapRoot> = (/*#__PURE__*/ new SingleContextKey(
    'bootstrap-root',
    {
      byDefault(ctx) {
        return ctx.get(BootstrapWindow).document.body;
      },
    },
));
