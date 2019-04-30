import { ComponentContext } from '../../component';
import { ComponentState } from '../state';
import { RenderDef } from './render-def';
import { RenderScheduler } from './render-scheduler';

/**
 * Component element render function interface.
 *
 * It has no arguments. It may return either nothing, or a function. In the latter case the returned function will be
 * called immediately to render the element. It may, in turn, return a render function, and so on.
 *
 * @returns Either delegated render, or nothing.
 */
export type ElementRender = (this: void) => void | ElementRender;

export const ElementRender = {

  /**
   * Enables component element rendering.
   *
   * The `render` call will be scheduled by `RenderScheduler` once component state updated.
   *
   * @param context Target component context.
   * @param render Element render function.
   * @param def Optional element render definition.
   */
  render(
      context: ComponentContext,
      render: ElementRender,
      def: RenderDef = {}) {

    const stateTracker = context.get(ComponentState);
    const schedule = context.get(RenderScheduler).newSchedule();

    const { offline } = def;
    let rendered = false;
    const stateInterest = stateTracker.onUpdate(() => {
      if (offline || context.connected) {
        scheduleRender();
      } else {
        rendered = false;
      }
    });

    if (offline) {
      scheduleRender();
    } else {
      context.whenOn(() => {
        if (!rendered) {
          scheduleRender();
        }
      }).whenDone(reason => {
        stateInterest.off(reason);
        rendered = true;
      });
    }

    function scheduleRender() {
      rendered = true;
      schedule.schedule(renderElement);
    }

    function renderElement() {
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
