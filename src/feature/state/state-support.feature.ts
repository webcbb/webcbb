import { StateTracker, StateUpdater } from 'fun-events';
import { BootstrapContext } from '../../kit';
import { Feature } from '../feature.decorator';

/**
 * Component state support feature.
 *
 * When enabled, it registers context values for each component with the following keys:
 *
 * - `[StateUpdater.key]` that allows to update the component state, and
 * - `[StateTracker.key]` containing a `StateTracker` instance to track the state changes.
 *
 * Other features would use this to notify when the state changes. E.g. `DomPropertiesSupport` and `AttributesSupport`
 * features issue state updates when needed.
 */
@Feature({
  init: enableStateSupport,
})
export class StateSupport {
}

function enableStateSupport(context: BootstrapContext) {
  context.forComponents({ as: StateTracker });
  context.forComponents({
    a: StateUpdater,
    by(tracker: StateTracker) {
      return tracker.update;
    },
    with: [StateTracker],
  });
}