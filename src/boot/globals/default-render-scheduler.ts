/**
 * @packageDocumentation
 * @module @wesib/wesib
 */
import { ContextValueOpts, ContextValues } from 'context-values';
import { ContextUpKey, ContextUpRef } from 'context-values/updatable';
import { AfterEvent, afterThe, EventKeeper, nextAfterEvent } from 'fun-events';
import { newRenderSchedule, RenderScheduler } from 'render-scheduler';
import { BootstrapWindow } from './bootstrap-window';

/**
 * Default rendering tasks scheduler.
 *
 * @category Core
 */
export type DefaultRenderScheduler = RenderScheduler;

class DefaultRenderSchedulerKey extends ContextUpKey<DefaultRenderScheduler, RenderScheduler> {

  readonly upKey: ContextUpKey.UpKey<DefaultRenderScheduler, RenderScheduler>;

  constructor() {
    super('default-render-scheduler');
    this.upKey = this.createUpKey(
        opts => opts.seed.keep.thru(
            (...fns) => {
              if (fns.length) {
                return toDefaultRenderScheduler(opts.context, fns[fns.length - 1]);
              }

              const defaultProvider = (): AfterEvent<[DefaultRenderScheduler]> => afterThe(
                  toDefaultRenderScheduler(opts.context, newRenderSchedule),
              );

              return nextAfterEvent(opts.byDefault(defaultProvider) || defaultProvider());
            },
        ),
    );
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          DefaultRenderScheduler,
          EventKeeper<RenderScheduler[]> | RenderScheduler,
          AfterEvent<RenderScheduler[]>>,
      ): DefaultRenderScheduler {

    let delegated!: DefaultRenderScheduler;

    opts.context.get(
        this.upKey,
        'or' in opts ? { or: opts.or != null ? afterThe(opts.or) : opts.or } : undefined,
    )!(scheduler => delegated = toDefaultRenderScheduler(opts.context, scheduler));

    return (...args) => delegated(...args);
  }

}

function toDefaultRenderScheduler(
    context: ContextValues,
    scheduler: RenderScheduler,
): DefaultRenderScheduler {
  return (options = {}) => scheduler({
    ...options,
    window: options.window || context.get(BootstrapWindow),
  });
}

/**
 * A key of bootstrap, definition, or component context value containing [[DefaultRenderScheduler]] instance.
 *
 * Uses the default `RenderScheduler` (`newRenderSchedule()`) for {@link BootstrapWindow bootstrap window}.
 *
 * @category Core
 */
export const DefaultRenderScheduler: ContextUpRef<DefaultRenderScheduler, RenderScheduler> = (
    /*#__PURE__*/ new DefaultRenderSchedulerKey()
);
