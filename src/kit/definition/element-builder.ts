import { noop } from 'call-thru';
import { ContextKey, ContextValueSpec } from 'context-values';
import { EventEmitter } from 'fun-events';
import { Class, mergeFunctions } from '../../common';
import { ComponentClass, ComponentDef, ComponentMount as ComponentMount_ } from '../../component';
import { ComponentContext as ComponentContext_, ComponentListener } from '../../component/component-context';
import { ComponentFactory as ComponentFactory_ } from '../../component/definition';
import {
  DefinitionContext as DefinitionContext_,
  DefinitionListener,
  ElementBaseClass,
} from '../../component/definition/definition-context';
import { ComponentValueRegistry } from './component-value-registry';
import { DefinitionValueRegistry } from './definition-value-registry';

/**
 * Creates new component of the given type.
 *
 * It makes component context available under `[ComponentContext.symbol]` key in constructed component.
 * The component context is also available inside component constructor by temporarily assigning it to component
 * prototype.
 *
 * @param <T> A type of component.
 * @param type Component class constructor.
 * @param context Target component context.
 */
function newComponent<T extends object>(type: ComponentClass<T>, context: ComponentContext_<T>): T {

  const proto = type.prototype as any;
  const prevContext = proto[ComponentContext_.symbol];

  proto[ComponentContext_.symbol] = context;
  try {

    const component = new type(context);

    Object.defineProperty(component, ComponentContext_.symbol, { value: context });

    return component;
  } finally {
    proto[ComponentContext_.symbol] = prevContext;
  }
}

const CONNECTED = Symbol('connected');
const CONNECT = Symbol('connect');

/**
 * @internal
 */
export class ElementBuilder {

  private readonly _definitionValueRegistry: DefinitionValueRegistry;
  private readonly _componentValueRegistry: ComponentValueRegistry;
  readonly definitions = new EventEmitter<DefinitionListener>();
  readonly components = new EventEmitter<ComponentListener>();

  static create(opts: {
    definitionValueRegistry: DefinitionValueRegistry;
    componentValueRegistry: ComponentValueRegistry;
  }): ElementBuilder {
    return new ElementBuilder(opts);
  }

  private constructor(
      {
        definitionValueRegistry,
        componentValueRegistry,
      }: {
        definitionValueRegistry: DefinitionValueRegistry;
        componentValueRegistry: ComponentValueRegistry;
      }) {
    this._definitionValueRegistry = definitionValueRegistry;
    this._componentValueRegistry = componentValueRegistry;
  }

  buildElement<T extends object>(componentType: ComponentClass<T>): ComponentFactory_<T> {

    const def = ComponentDef.of(componentType);
    const builder = this;
    const onComponent = new EventEmitter<ComponentListener>();
    let typeValueRegistry!: ComponentValueRegistry;
    let whenReady: (this: DefinitionContext, elementType: Class) => void = noop;
    let definitionContext: DefinitionContext;

    function createValueRegistry() {
      return builder._componentValueRegistry.append(typeValueRegistry);
    }

    class ComponentFactory extends ComponentFactory_<T> {

      get componentType() {
        return definitionContext.componentType;
      }

      get elementType() {
        return definitionContext.elementType;
      }

      mountTo(element: any): ComponentMount_<T> {
        if (element[ComponentContext_.symbol]) {
          throw new Error(`Element ${element} already bound to component`);
        }

        let context: ComponentContext_<T>;

        class ComponentMount extends ComponentMount_<T> {

          get context() {
            return context;
          }

          get connected() {
            return element[CONNECTED];
          }

          set connected(value: boolean) {
            if (this.connected === value) {
              return;
            }
            element[CONNECT](value);
          }

        }

        const mount = new ComponentMount();

        context = builder._createComponent({
          definitionContext,
          onComponent,
          valueRegistry: createValueRegistry(),
          element,
          elementSuper(key) {
            return element[key];
          },
          mount,
        });

        return mount;
      }

    }

    const componentFactory = new ComponentFactory();

    class DefinitionContext extends DefinitionContext_<T> {

      readonly componentType: ComponentClass<T> = componentType;
      readonly onComponent = onComponent.on;
      readonly get: <V, S>(key: ContextKey<V, S>, defaultValue: V | null | undefined) => V | null | undefined;

      constructor() {
        super();
        typeValueRegistry = ComponentValueRegistry.create(builder._definitionValueRegistry.bindSources(this));
        typeValueRegistry.provide({ a: DefinitionContext_, is: this });
        typeValueRegistry.provide({ a: ComponentFactory_, is: componentFactory });

        const values = typeValueRegistry.newValues();

        this.get = values.get;
      }

      get elementType(): Class {
        throw new Error('Custom element class is not constructed yet. Consider to use a `whenReady()` callback');
      }

      whenReady(callback: (this: DefinitionContext, elementType: Class) => void) {
        whenReady = mergeFunctions<[Class], void, DefinitionContext>(whenReady, callback);
      }

      forComponents<S>(spec: ContextValueSpec<ComponentContext_<any>, any, any[], S>): void {
        typeValueRegistry.provide(spec);
      }

    }

    definitionContext = new DefinitionContext();

    if (def.define) {
      def.define.call(componentType, definitionContext);
    }
    this.definitions.forEach(listener => listener(definitionContext));

    const elementType = this._elementType(definitionContext, onComponent, createValueRegistry());

    Object.defineProperty(definitionContext, 'elementType', {
      configurable: true,
      enumerable: true,
      value: elementType,
    });
    Object.defineProperty(definitionContext, 'whenReady', {
      configurable: true,
      value(callback: (elementType: Class) => void) {
        callback.call(definitionContext, elementType);
      },
    });

    whenReady.call(definitionContext, elementType);

    return componentFactory;
  }

  private _elementType<T extends object>(
      definitionContext: DefinitionContext_<T>,
      onComponent: EventEmitter<ComponentListener>,
      valueRegistry: ComponentValueRegistry) {

    const builder = this;
    const elementBaseClass = definitionContext.get(ElementBaseClass);

    class Element extends elementBaseClass {

      // Component context reference
      [ComponentContext_.symbol]: ComponentContext_<T>;

      private readonly [CONNECT]: ((value: boolean) => void);
      private [CONNECTED]: boolean;

      constructor() {
        super();
        builder._createComponent({
          definitionContext,
          onComponent,
          valueRegistry,
          element: this,
          elementSuper: (key) => {
            // @ts-ignore
            return super[key] as any;
          }
        });
      }

      // noinspection JSUnusedGlobalSymbols
      connectedCallback() {
        this[CONNECT](true);
      }

      // noinspection JSUnusedGlobalSymbols
      disconnectedCallback() {
        this[CONNECT](false);
      }

    }

    return Element;
  }

  private _createComponent<T extends object>(
      {
        definitionContext,
        onComponent,
        valueRegistry,
        element,
        mount,
        elementSuper,
      }: ComponentMeta<T>): ComponentContext_<T> {

    let whenReady: (this: ComponentContext, component: T) => void = noop;
    const connectEvents = new EventEmitter<(this: any) => void>();
    const disconnectEvents = new EventEmitter<(this: any) => void>();

    class ComponentContext extends ComponentContext_<T> {

      readonly componentType = definitionContext.componentType;
      readonly element = element;
      readonly elementSuper = elementSuper;
      readonly get = valueRegistry.newValues().get;
      readonly onConnect = connectEvents.on;
      readonly onDisconnect = disconnectEvents.on;

      get component(): T {
        throw new Error('The component is not constructed yet. Consider to use a `whenReady()` callback');
      }

      get mount() {
        return mount;
      }

      get connected() {
        return element[CONNECTED];
      }

      whenReady(callback: (this: ComponentContext, component: T) => void) {
        whenReady = mergeFunctions<[T], void, ComponentContext>(whenReady, callback);
      }

    }

    const context = new ComponentContext();

    valueRegistry.provide({ a: ComponentContext_, is: context });

    Object.defineProperty(element, ComponentContext_.symbol, { value: context });
    Object.defineProperty(element, CONNECTED, { writable: true, value: false });
    Object.defineProperty(element, CONNECT, {
      value(value: boolean) {
        this[CONNECTED] = value;
        (value ? connectEvents : disconnectEvents).forEach(listener => listener.call(context));
      },
    });

    this.components.forEach(consumer => consumer(context));
    onComponent.forEach(consumer => consumer(context));

    const component = newComponent(definitionContext.componentType, context);

    Object.defineProperty(context, 'component', {
      configurable: true,
      enumerable: true,
      value: component,
    });
    Object.defineProperty(context, 'whenReady', {
      configurable: true,
      value(callback: (component: T) => void) {
        callback.call(context, component);
      },
    });

    whenReady.call(context, component);

    return context;
  }

}

interface ComponentMeta<T extends object> {
  definitionContext: DefinitionContext_<T>;
  onComponent: EventEmitter<ComponentListener>;
  valueRegistry: ComponentValueRegistry;
  element: any;
  elementSuper: (name: PropertyKey) => any;
  mount?: ComponentMount_<T>;
}
