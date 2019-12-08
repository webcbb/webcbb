/**
 * @module @wesib/wesib
 */
import { ContextKey, ContextKey__symbol, ContextValues, ContextValueSpec } from 'context-values';
import { OnEvent } from 'fun-events';
import { Class } from '../../common';
import { ComponentContext } from '../component-context';
import { ComponentClass } from './component-class';
import { DefinitionContext__key } from './definition.context.key.impl';
import { ElementDef } from './element-def';

/**
 * Component definition context.
 *
 * Extends `ContextValues` interface. The values are provided by corresponding providers registered with
 * `BootstrapContext.perDefinition()` method. All [[BootstrapContext]] values are available too.
 *
 * @category Core
 * @typeparam T  A type of component.
 */
export abstract class DefinitionContext<T extends object = any> extends ContextValues {

  /**
   * A key of definition context value containing the definition context itself.
   */
  static get [ContextKey__symbol](): ContextKey<DefinitionContext> {
    return DefinitionContext__key;
  }

  /**
   * Component class constructor.
   */
  abstract readonly componentType: ComponentClass<T>;

  /**
   * Custom element class constructor.
   *
   * It is an error accessing this property before the element class is created, e.g. from inside of
   * `DefinitionListener` or `ComponentDef.define()` function. In these cases you may wish to add a `whenReady()`
   * callback.
   */
  abstract readonly elementType: Class;

  /**
   * An `OnEvent` sender of component definition readiness event.
   *
   * The custom element class is not constructed until component definition is complete.
   * The registered receiver will be notified when the custom element class is constructed.
   *
   * If the custom element class is constructed already, the receiver will be notified immediately.
   */
  abstract readonly whenReady: OnEvent<[this]>;

  /**
   * Custom element definition.
   */
  get elementDef(): ElementDef {
    return this.get(ElementDef);
  }

  /**
   * An `OnEvent` sender of component construction events.
   *
   * The registered receiver will be notified right before the defined component is constructed.
   */
  abstract readonly onComponent: OnEvent<[ComponentContext<T>]>;

  /**
   * Provides a value available in the context of each component of the defined component type.
   *
   * @typeparam Deps  A type of dependencies.
   * @typeparam Src  The type of context value sources.
   * @typeparam Seed  Value seed type.
   * @param spec  Component context value specifier.
   *
   * @returns A function that removes the given context value specifier when called.
   */
  abstract perComponent<Deps extends any[], Src, Seed>(
      spec: ContextValueSpec<ComponentContext<T>, any, Deps, Src, Seed>,
  ): () => void;

}
