import { EventEmitter } from '../../common';
import { ComponentValueKey } from '../../component';
import { WebFeature } from '../../decorators';
import { BootstrapContext } from '../../feature';
import { StateTracker } from './state-tracker';

/**
 * Component state support feature.
 *
 * When enabled, it registers context values for each component with the following keys:
 *
 * - `ComponentValueKey.stateRefresh` that allows to refresh the component state, and
 * - `StateTracker.key` containing a `StateTracker` instance to track the state changes.
 *
 * Other features would use this to notify when the state changes. E.g. `DomPropertiesSupport` and `AttributesSupport`
 * features issue state refresh when needed.
 */
@WebFeature({
  configure: enableStateSupport,
})
export class StateSupport {
}

function enableStateSupport(context: BootstrapContext) {
  context.provide(StateTracker.key, () => {

    const emitter = new EventEmitter<() => void>();

    class Tracker implements StateTracker {

      readonly onStateUpdate = emitter.on;

      refreshState() {
        emitter.notify();
      }

    }

    return new Tracker();
  });
  context.provide(ComponentValueKey.stateRefresh, ctx => {

    const stateTracker = ctx.get(StateTracker.key);

    return () => stateTracker.refreshState();
  });
}