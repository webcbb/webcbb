import { ContextValueKey, EventProducer, SingleValueKey, StateUpdateConsumer } from '../../common';

/**
 * Component state tracker.
 *
 * It is available in component context under `[StateTracker.key]` value key when `StateSupport` feature is enabled.
 */
export abstract class StateTracker {

  /**
   * A `StateTracker` component context value key.
   */
  static readonly key: ContextValueKey<StateTracker> = new SingleValueKey('state-tracker');

  /**
   * Registers component state updates listener.
   *
   * This listener will be notified when `updateState()` is called.
   *
   * @param listener A listener to notify on state updates.
   *
   * @return An event interest instance.
   */
  abstract readonly onStateUpdate: EventProducer<StateUpdateConsumer>;

  /**
   * Updates the component state.
   *
   * All listeners registered with `onStateUpdate()` will be notified on this update.
   *
   * This method is also called by the function available under `[ComponentContext.stateUpdateKey]` key.
   * The latter is preferred way to call it, as the caller won't depend on `StateSupport` feature then.
   *
   * @param <V> A type of changed value.
   * @param key Changed value key.
   * @param newValue New value.
   * @param oldValue Previous value.
   */
  abstract readonly updateState: StateUpdateConsumer;

}
