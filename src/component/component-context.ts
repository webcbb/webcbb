import { OnDomEvent } from '@frontmeans/dom-events';
import { ContextKey, ContextKey__symbol, ContextValues } from '@proc7ts/context-values';
import { AfterEvent, OnEvent, StatePath } from '@proc7ts/fun-events';
import { Supply, SupplyPeer } from '@proc7ts/supply';
import { ComponentContext__key } from './component-context.key.impl';
import { ComponentEventDispatcher__key } from './component-event-dispatcher.key.impl';
import { ContentRoot } from './content-root';
import { ComponentClass } from './definition';
import { StateUpdater } from './state-updater';

/**
 * A key of component instance method returning its component context.
 *
 * @category Core
 */
export const ComponentContext__symbol = (/*#__PURE__*/ Symbol('component-context'));

/**
 * Component context.
 *
 * Passed to component constructor as its only parameter.
 *
 * Extends `ContextValues` interface. The values are provided by corresponding providers registered with
 * {@link BootstrapSetup.perComponent}} and {@link DefinitionSetup.perComponent} methods.
 *
 * @category Core
 * @typeParam T - A type of component.
 */
export abstract class ComponentContext<T extends object = any> extends ContextValues implements SupplyPeer {

  /**
   * A key of component context value containing the component context instance itself.
   */
  static get [ContextKey__symbol](): ContextKey<ComponentContext> {
    return ComponentContext__key;
  }

  /**
   * Extracts component context from the given component instance.
   *
   * @param component - Target component instance.
   *
   * @return Component context reference returned by {@link ComponentContext__symbol} method.
   *
   * @throws TypeError  When the given `component` does not contain component context reference.
   */
  static of<T extends object>(component: ComponentInstance<T>): ComponentContext<T> {
    if (typeof component[ComponentContext__symbol] !== 'function') {
      throw new TypeError(`No component context found in ${String(component)}`);
    }
    return component[ComponentContext__symbol]!();
  }

  /**
   * Component class constructor.
   */
  abstract readonly componentType: ComponentClass<T>;

  /**
   * Custom element constructed for the component according to its type.
   *
   * E.g. `HTMLElement` instance.
   */
  abstract readonly element: any;

  /**
   * A component instance.
   *
   * It is an error accessing this property before the component is created, e.g. from inside of component constructor
   * or {@link DefinitionContext.whenComponent component instantiation event} receiver. A {@link whenReady} callback
   * could be utilized to work this around.
   */
  abstract readonly component: ComponentInstance<T>;

  /**
   * Whether the component is {@link DefinitionContext.mountTo mounted} to element.
   */
  abstract readonly mounted: boolean;

  /**
   * Whether the component is ready.
   *
   * Set to `true` when {@link component} is available.
   */
  abstract readonly ready: boolean;

  /**
   * An `OnEvent` sender of component readiness event.
   *
   * The component is constructed shortly after custom element. So the component may not exist when requested
   * e.g. inside component constructor or {@link DefinitionContext.whenComponent component instantiation event}
   * receiver. The registered receiver will be notified when the component is constructed.
   *
   * If the component is constructed already, the receiver will be notified immediately.
   */
  abstract readonly onceReady: OnEvent<[this]>;

  /**
   * An `OnEvent` sender of single component readiness event.
   *
   * The component is constructed shortly after custom element. So the component may not exist when requested
   * e.g. inside component constructor or {@link DefinitionContext.whenComponent component instantiation event}
   * receiver. The registered receiver will be notified when the component is constructed.
   *
   * If the component is constructed already, the receiver will be notified immediately.
   *
   * In contrast to {@link onceReady}, cuts off the event supply after sending the first event.
   */
  abstract readonly whenReady: OnEvent<[this]>;

  /**
   * Whether the component is settled.
   *
   * Component settlement happens:
   * - when {@link settle} method is called,
   * - when component is {@link DefinitionContext.mountTo mounted} to element, or
   * - when component's element is {@link connected}.
   *
   * It is guaranteed that component settlement won't happen inside custom element's constructor. So the settlement
   * event may be used e.g. to start DOM manipulations, as the latter is prohibited inside custom element constructor.
   *
   * This becomes `true` right before {@link whenSettled} event is sent.
   */
  abstract readonly settled: boolean;

  /**
   * An `OnEvent` sender of component settlement event.
   *
   * The registered receiver is called when component is {@link settled}. If settled already the receiver is called
   * immediately.
   */
  abstract readonly onceSettled: OnEvent<[this]>;

  /**
   * An `OnEvent` sender of single component settlement event.
   *
   * The registered receiver is called when component is {@link settled}. If settled already the receiver is called
   * immediately.
   *
   * In contrast to {@link onceSettled}, cuts off the event supply after sending the first event.
   */
  abstract readonly whenSettled: OnEvent<[this]>;

  /**
   * Whether the component's element is connected.
   *
   * This becomes `true` right before {@link whenConnected} event is sent.
   */
  abstract readonly connected: boolean;

  /**
   * An `OnEvent` sender of component's element connection event.
   *
   * The registered receiver is called when component's element is connected. E.g. when custom element's
   * `connectedCallback()` method is called.
   *
   * If connected already the receiver is called immediately.
   */
  abstract readonly onceConnected: OnEvent<[this]>;

  /**
   * An `OnEvent` sender of single component's element connection event.
   *
   * The registered receiver is called when component's element is connected. E.g. when custom element's
   * `connectedCallback()` method is called.
   *
   * If connected already the receiver is called immediately.
   *
   * In contrast to {@link onceConnected}, cuts off the event supply after sending the first event.
   */
  abstract readonly whenConnected: OnEvent<[this]>;

  /**
   * An `AfterEvent` keeper of component status.
   *
   * Sends this context instance each time the component status changes.
   */
  abstract readonly readStatus: AfterEvent<[this]>;

  /**
   * An event supply that {@link destroy destroys} component when cut off.
   */
  abstract readonly supply: Supply;

  /**
   * Updates component's state.
   *
   * This is a shorthand for invoking a component {@link StateUpdater state updater} .
   *
   * @typeParam TValue - A type of changed value.
   * @param key - Changed value key.
   * @param newValue - New value.
   * @param oldValue - Previous value.
   */
  readonly updateState: StateUpdater;

  constructor() {
    super();
    this.updateState = <TValue>(key: StatePath, newValue: TValue, oldValue: TValue): void => {
      this.get(StateUpdater)(key, newValue, oldValue);
    };
  }

  /**
   * Component content root.
   *
   * This is a shorthand for requesting a {@link ContentRoot content root} from component context.
   */
  get contentRoot(): ContentRoot {
    return this.get(ContentRoot);
  }

  /**
   * Settles component.
   *
   * Calling this method has no effect if component is {@link settled} already, when component is not
   * {@link whenReady ready} yet, or custom element's constructor is not exited.
   *
   * Calling this method may trigger DOM manipulations (the latter is prohibited inside custom element's constructor).
   * This may be desired for rendering optimizations. E.g. to render element's content _before_ adding it to document.
   *
   * This method is called automatically when {@link DefinitionContext.mountTo mounting} component to element.
   */
  abstract settle(): void;

  /**
   * Returns a DOM event producer for the given event type.
   *
   * This is a shorthand for invoking a component event producer function available under
   * `[ComponentEventProducer.key]` key.
   *
   * @typeParam TEvent - DOM event type.
   * @param type - An event type to listen for.
   *
   * @returns A producer of DOM event events of the given type.
   */
  on<TEvent extends Event>(type: string): OnDomEvent<TEvent> {
    return this.get(ComponentEventDispatcher__key).on(type);
  }

  /**
   * Dispatches an event to component element.
   *
   * This is a shorthand for invoking a component {@link ComponentEventDispatcher event dispatcher}.
   *
   * @param event - An event to dispatch.
   */
  dispatchEvent(event: Event): void {
    this.get(ComponentEventDispatcher__key).dispatch(event);
  }

  /**
   * Destroys the component.
   *
   * Removes element from the DOM tree. I.e. disconnects custom element first.
   *
   * After this method call the component should no longer be used.
   *
   * Note that component destruction is virtual. It is up to developer to decide when component is no longer needed.
   * However the component is destroyed automatically once disconnected, i.e. when custom element's
   * `disconnectedCallback()` method is called.
   *
   * @param reason - Optional reason of destruction.
   */
  abstract destroy(reason?: any): void;

}

/**
 * A component instance.
 *
 * @category Core
 */
export type ComponentInstance<T extends object = any> = T & {

  /**
   * @returns Component context.
   */
  [ComponentContext__symbol]?(): ComponentContext<T>;

};
