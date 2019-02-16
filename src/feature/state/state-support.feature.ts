import { StateTracker, StateUpdater } from 'fun-events';
import { FeatureDef } from '../feature-def';

const DEF: FeatureDef = {
  forComponents: [
    { as: StateTracker },
    {
      a: StateUpdater,
      by(tracker: StateTracker) {
        return tracker.update;
      },
      with: [StateTracker],
    },
  ],
};

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
export class StateSupport {

  static get [FeatureDef.symbol](): FeatureDef {
    return DEF;
  }

}
