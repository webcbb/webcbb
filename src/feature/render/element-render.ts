/**
 * @packageDocumentation
 * @module @wesib/wesib
 */
import { noop } from 'call-thru';
import { DefaultRenderScheduler } from '../../boot/globals';
import { ComponentContext } from '../../component';
import { ComponentState } from '../state';
import { RenderDef } from './render-def';

/**
 * Component element render function interface.
 *
 * It has no arguments. It may return either nothing, or a function. In the latter case the returned function will be
 * called immediately to render the element. It may, in turn, return a render function, and so on.
 *
 * @category Feature
 */
export type ElementRender =
/**
 * @returns Either delegated render, or nothing.
 */
    (this: void) => void | ElementRender;

const enum RenderStatus {
  Pending,
  Scheduled,
  Complete,
}

/**
 * @category Feature
 */
export const ElementRender = {

  /**
   * Enables component element rendering.
   *
   * The `render` call will be scheduled by [[DefaultRenderScheduler]] once component state updated.
   *
   * @param context  Target component context.
   * @param render  Element render function.
   * @param def  Optional element render definition.
   */
  render(
      this: void,
      context: ComponentContext,
      render: ElementRender,
      def: RenderDef = {},
  ): void {

    const { offline, path = [] } = def;
    const stateTracker = context.get(ComponentState).track(path);
    const schedule = context.get(DefaultRenderScheduler)();

    let status = RenderStatus.Pending;
    const stateSupply = stateTracker.onUpdate(() => {
      if (offline || context.connected) {
        scheduleRender();
      } else {
        status = RenderStatus.Pending; // Require rendering next time online
      }
    });

    if (offline) {
      scheduleRender();
    } else {
      context.whenOn(supply => {
        if (!status) { // There is an update to render
          scheduleRender();
        }
        supply.whenOff(() => {
          if (cancelRender()) { // Prevent rendering while offline
            status = RenderStatus.Pending; // Require rendering next time online
          }
        });
      }).whenOff(reason => {
        // Component destroyed
        cancelRender();
        status = RenderStatus.Complete;
        stateSupply.off(reason);
      });
    }

    function scheduleRender(): void {
      status = RenderStatus.Scheduled;
      schedule(renderElement);
    }

    function cancelRender(): boolean {
      if (status === RenderStatus.Scheduled) { // Scheduled, but not rendered yet
        schedule(noop);
        return true;
      }
      return false;
    }

    function renderElement(): void {
      status = RenderStatus.Complete;
      for (;;) {

        const newRender = render();

        if (newRender === render || typeof newRender !== 'function') {
          break;
        }

        render = newRender;
      }
    }
  },

};
