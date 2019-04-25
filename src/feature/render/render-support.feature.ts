import { noop } from 'call-thru';
import { BootstrapWindow } from '../../kit';
import { FeatureDef, FeatureDef__symbol } from '../feature-def';
import { RenderScheduler as RenderScheduler_ } from './render-scheduler';

const RenderSupport__feature: FeatureDef = {
  perComponent: {
    a: RenderScheduler_,
    by: createRenderScheduler,
    with: [BootstrapWindow],
  },
};

/**
 * Rendering support feature.
 *
 * This feature is automatically enabled when `@Render` decorator is used.
 */
export class RenderSupport {

  static get [FeatureDef__symbol](): FeatureDef {
    return RenderSupport__feature;
  }

}

function createRenderScheduler<T extends object>(window: BootstrapWindow) {

  let scheduled: () => void = noop;

  class RenderScheduler extends RenderScheduler_ {

    scheduleRender(render: (this: void) => void): void {

      const previouslyScheduled = scheduled;

      scheduled = render;
      if (previouslyScheduled === noop) {
        window.requestAnimationFrame(() => {
          scheduled();
          scheduled = noop;
        });
      }
    }

  }

  return new RenderScheduler();
}
