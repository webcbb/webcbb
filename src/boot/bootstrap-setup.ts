/**
 * @packageDocumentation
 * @module @wesib/wesib
 */
import { ContextValueSpec } from 'context-values';
import { OnEvent } from 'fun-events';
import { Class } from '../common';
import { ComponentContext } from '../component';
import { ComponentClass, DefinitionContext, DefinitionSetup } from '../component/definition';
import { FeatureContext } from '../feature';
import { BootstrapContext } from './index';

/**
 * Bootstrap context setup.
 *
 * It is passed to [[FeatureDef.Options.setup]] method to set up the bootstrap. E.g. by providing bootstrap context
 * values.
 *
 * @category Core
 */
export interface BootstrapSetup {

  /**
   * Feature class performing bootstrap setup.
   */
  readonly feature: Class;

  /**
   * An `OnEvent` sender of component definition events.
   *
   * The registered receiver will be notified when new component class is defined, but before its custom element class
   * constructed.
   */
  readonly onDefinition: OnEvent<[DefinitionContext]>;

  /**
   * An `OnEvent` sender of component construction events.
   *
   * The registered receiver will be notified right before component is constructed.
   */
  readonly onComponent: OnEvent<[ComponentContext]>;

  /**
   * An `OnEvent` sender of feature readiness event.
   *
   * The registered receiver will be notified once bootstrap is complete and the feature is loaded.
   *
   * If the above conditions satisfied, the receiver will be notified immediately.
   */
  readonly whenReady: OnEvent<[FeatureContext]>;

  /**
   * Provides bootstrap context value before context creation.
   *
   * @typeparam Deps  Dependencies tuple type.
   * @typeparam Src  Source value type.
   * @typeparam Seed  Value seed type.
   * @param spec  Context value specifier.
   *
   * @returns A function that removes the given context value specifier when called.
   */
  provide<Deps extends any[], Src, Seed>(
      spec: ContextValueSpec<BootstrapContext, any, Deps, Src, Seed>,
  ): () => void;

  /**
   * Provides a value available in each component definition context.
   *
   * @typeparam Deps  A type of dependencies.
   * @typeparam Src  The type of context value sources.
   * @typeparam Seed  Value seed type.
   * @param spec  Component definition context value specifier.
   *
   * @returns A function that removes the given context value specifier when called.
   */
  perDefinition<Deps extends any[], Src, Seed>(
      spec: ContextValueSpec<DefinitionContext, any, Deps, Src, Seed>,
  ): () => void;

  /**
   * Provides a value available in each component context.
   *
   * @typeparam Deps  A type of dependencies.
   * @typeparam Src  The type of context value sources.
   * @typeparam Seed  Value seed type.
   * @param spec  Component context value specifier.
   *
   * @returns A function that removes the given context value specifier when called.
   */
  perComponent<Deps extends any[], Src, Seed>(
      spec: ContextValueSpec<ComponentContext, any, Deps, Src, Seed>,
  ): () => void;

  /**
   * Sets up the definition of component of the given type..
   *
   * Whenever the definition of component of the given type or any of its subtype starts, the returned `OnEvent` sender
   * sends a [[DefinitionSetup]] instance, that can be used to set up the definition.
   *
   * @param componentType  Target component type.
   *
   * @returns An `OnEvent` sender of component definition setup instances.
   */
  setupDefinition<T extends object>(componentType: ComponentClass<T>): OnEvent<[DefinitionSetup]>;

}
