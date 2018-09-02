import { EventProducer, noop } from '../common';

/**
 * Web component context.
 *
 * Passed to component constructor as its only parameter.
 *
 * @param <E> A type of HTML element.
 */
export interface ComponentContext<T extends object = object, E extends HTMLElement = HTMLElement> {

  /**
   * Custom HTML element constructed for the component according to its type.
   */
  readonly element: E;

  /**
   * A promise resolved to component.
   *
   * The component is constructed shortly after the HTML element. So the component may not exist when requested
   * e.g. inside component constructor, or inside `ElementListener`.
   */
  readonly component: Promise<T>;

  /**
   * Registers custom HTML element connection listener.
   *
   * This listener will be called when custom element is connected, i.e. its `connectedCallback()` method is called.
   *
   * @param listener A listener to notify on element connection.
   *
   * @return An event interest instance.
   */
  readonly onConnect: EventProducer<(this: this) => void>;

  /**
   * Registers custom HTML element disconnection listener.
   *
   * This listener will be called when custom element is disconnected, i.e. its `disconnectedCallback()` method is
   * called.
   *
   * @param listener A listener to notify on element disconnection.
   *
   * @return An event interest instance.
   */
  readonly onDisconnect: EventProducer<(this: this) => void>;

  /**
   * Returns a `super` property value inherited from custom HTML element parent.
   *
   * @param name Target property name.
   */
  elementSuper(name: string): any;

  get<V>(key: ComponentValueKey<V>, defaultValue?: V): V;

  get<V>(key: ComponentValueKey<V>, defaultValue: V | null): V | null;

  get<V>(key: ComponentValueKey<V>, defaultValue: V | undefined): V | undefined;

  /**
   * Returns a value associated with the given key.
   *
   * Values are provided by corresponding providers registered with `Components.provide()` method.
   *
   * @param <V> The type of associated value.
   * @param key Target key.
   * @param defaultValue Default value to return if there is no value associated with the given key. Can be `null`
   * or `undefined` too.
   *
   * @returns Associated value.
   *
   * @throws Error If there is no value associated with the given key and the default key is not provided neither
   * as function argument, nor as `ComponentValueKey.defaultValue` property.
   */
  get<V>(key: ComponentValueKey<V>, defaultValue: V | null | undefined): V | null | undefined;

  /**
   * Updates the state of web component.
   *
   * It is a shorthand for invoking a component state update function available under `ComponentValueKey.stateUpdate`
   * key.
   *
   * Note that state refresh has no effect, unless `StateSupport` feature is enabled.
   *
   * @param <V> A type of changed value.
   * @param key Changed value key.
   * @param newValue New value.
   * @param oldValue Previous value.
   */
  updateState<V>(key: PropertyKey, newValue: V, oldValue: V): void;

}

/**
 * Component value key.
 *
 * Every key should be an unique instance of this class.
 *
 * @param <V> The type of associated value.
 */
export class ComponentValueKey<V> {

  /**
   * Component value key containing a component state update function.
   *
   * Features are calling this function by default when component state changes, e.g. attribute value or DOM property
   * modified.
   *
   * Note that this value is not provided, unless the `StateSupport` feature is enabled.
   */
  static readonly stateUpdate: ComponentValueKey<StateUpdateConsumer> =
      new ComponentValueKey('state-update', noop);

  /**
   * Human-readable key name.
   *
   * This is not necessary unique.
   */
  readonly name: string;

  /**
   * The value used when there is no value associated with this key.
   *
   * If `undefined`, then there is no default value.
   */
  readonly defaultValue: V | undefined;

  /**
   * Constructs component context key.
   *
   * @param name Human-readable key name.
   * @param defaultValue Optional default value. If unspecified or `undefined` the key has no default value.
   */
  constructor(name: string, defaultValue?: V) {
    this.name = name;
    this.defaultValue = defaultValue;
  }

  toString(): string {
    return `ComponentValueKey(${this.name})`;
  }

}

/**
 * A consumer of state updates.
 *
 * It is called when the value with the given `key` changes.
 *
 * @param <V> A type of changed value.
 * @param key Changed value key.
 * @param newValue New value.
 * @param oldValue Previous value.
 */
export type StateUpdateConsumer = <V>(this: void, key: PropertyKey, newValue: V, oldValue: V) => void;

/**
 * Component value provider.
 *
 * It is responsible for constructing the values associated with particular key for each component.
 *
 * This function is called at most once per component, unless it returns `null`/`undefined`. In the latter case
 * it may be called again later.
 *
 * @param <V> The type of associated value.
 * @param context Target component context.
 *
 * @return Either constructed value, or `null`/`undefined` if the value can not be constructed.
 */
export type ComponentValueProvider<V> =
    <T extends object, E extends HTMLElement>(context: ComponentContext<T, E>) => V | null | undefined;

export namespace ComponentContext {

  /**
   * A key of a custom HTML element property and web component containing a reference to web component context.
   */
  export const symbol = Symbol('web-component-context');

  /**
   * Extracts component context from its custom HTML element or from component instance.
   *
   * @param element Custom HTML element instance created for web component, or the web component itself.
   *
   * @return Web component context reference stored under `ComponentContext.symbol` key.
   *
   * @throws TypeError When the given `element` does not contain component context reference.
   */
  export function of<T extends object, E extends HTMLElement>(element: E | T): ComponentContext<T, E> {

    const context = ComponentContext.find<T, E>(element);

    if (!context) {
      throw TypeError(`No component context found in ${element}`);
    }

    return context;
  }

  /**
   * Extracts component context from its custom HTML element or from component instance.
   *
   * @param element Custom HTML element instance created for web component, or the web component itself.
   *
   * @return Web component context reference stored under `ComponentContext.symbol` key.
   *
   * @throws TypeError When the given `element` does not contain component context reference.
   */
  export function find<T extends object, E extends HTMLElement>(element: E | T): ComponentContext<T, E> | undefined {
    return (element as any)[symbol];
  }

}
