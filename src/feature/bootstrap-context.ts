import { EventProducer } from 'fun-events';
import { ContextValues, ContextValueSpec } from '../common';
import {
  ComponentClass,
  ComponentContext,
  ComponentListener,
  DefinitionContext,
  DefinitionListener,
} from '../component';

/**
 * Components bootstrap context.
 *
 * An instance of this class is passed to `FeatureDef.bootstrap()` method so that the feature can configure itself.
 *
 * Extends `BootstrapValues` interface. The values are pre-bootstrapped by features. I.e. configured in their
 * definitions as `FeatureDef.prebootstrap`.
 */
export abstract class BootstrapContext extends ContextValues {

  /**
   * Registers component definition listener.
   *
   * This listener will be called when new component class is defined, but before its custom element class constructed.
   *
   * @param listener A listener to notify on each component definition.
   *
   * @return An event interest instance.
   */
  abstract readonly onDefinition: EventProducer<DefinitionListener>;

  /**
   * Registers component construction listener.
   *
   * This listener will be called right before component is constructed.
   *
   * @param listener A listener to notify on each component construction.
   *
   * @return An event interest instance.
   */
  abstract readonly onComponent: EventProducer<ComponentListener>;

  /**
   * Defines a component.
   *
   * Creates a custom element according to component definition, and registers it with custom elements registry.
   *
   * Note that custom element definition will happen only when all features configuration complete.
   *
   * @param <T> A type of component.
   * @param componentType Component class constructor.
   *
   * @return Custom element class constructor registered as custom element.
   *
   * @throws TypeError If `componentType` does not contain a component definition.
   */
  abstract define<T extends object>(componentType: ComponentClass<T>): void;

  /**
   * Allows to wait for component definition.
   *
   * This corresponds to `window.customElements.whenDefined()` method.
   *
   * @param componentType Component class constructor.
   *
   * @return A promise that is resolved when the given `componentType` is registered.
   *
   * @throws TypeError If `componentType` does not contain a component definition.
   */
  abstract whenDefined(componentType: ComponentClass<any>): PromiseLike<void>;

  /**
   * Registers provider that associates a value with the given key with component types.
   *
   * The given provider will be requested for the value at most once per component.
   *
   * @param <S> The type of context value sources.
   * @param spec Component definition context value specifier.
   */
  abstract forDefinitions<S>(spec: ContextValueSpec<DefinitionContext<any>, any, S>): void;

  /**
   * Registers provider that associates a value with the given key with components.
   *
   * The given provider will be requested for the value at most once per component.
   *
   * @param <S> The type of context value sources.
   * @param spec Component context value specifier.
   */
  abstract forComponents<S>(spec: ContextValueSpec<ComponentContext<any>, any, S>): void;

}
