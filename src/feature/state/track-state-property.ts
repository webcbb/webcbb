/**
 * @packageDocumentation
 * @module @wesib/wesib
 */
import { nextArgs } from 'call-thru';
import { EventSupply, eventSupply, EventSupply__symbol, OnEvent, StatePath, ValueTracker } from 'fun-events';
import { EventReceiver } from 'fun-events/d.ts/base';
import { ComponentContext } from '../../component';
import { ComponentState } from './component-state';
import { statePropertyPathTo } from './state-property-path';

/**
 * Creates a tracker of component state value.
 *
 * Requires [[StateSupport]] feature to be enabled and property to be defined. E.g. with {@link StateProperty
 * @StateProperty} decorator.
 *
 * @category Feature
 * @typeparam T  A type of state property value.
 * @param context  Target component context.
 * @param key  Property key.
 * @param path  Property state path.
 *
 * @returns New state property value tracker.
 */
export function trackStateProperty<T = any>(
    context: ComponentContext,
    key: PropertyKey,
    path: StatePath = statePropertyPathTo(key),
): ValueTracker<T> {

  const supply = eventSupply();

  class StatePropertyTracker extends ValueTracker<T> {

    get [EventSupply__symbol](): EventSupply {
      return supply;
    }

    get it(): T {
      return context.component[key];
    }

    set it(value: T) {
      if (!supply.isOff) {
        context.component[key] = value;
      }
    }

    on(): OnEvent<[T, T]>;
    on(receiver: EventReceiver<[T, T]>): EventSupply;
    on(receiver?: EventReceiver<[T, T]>): OnEvent<[T, T]> | EventSupply {
      return (this.on = context.get(ComponentState).track(path).onUpdate().thru(
          (_path, newValue, oldValue) => nextArgs(newValue, oldValue),
      ).tillOff(supply).F)(receiver);
    }

  }

  return new StatePropertyTracker();
}
