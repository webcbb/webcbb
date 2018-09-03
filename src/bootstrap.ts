import { ContextValueKey } from './common';
import { ComponentType, ComponentValueProvider } from './component';
import { ComponentRegistry } from './element/component-registry';
import { ElementBuilder } from './element/element-builder';
import { ProviderRegistry } from './element/provider-registry';
import { BootstrapContext, FeatureType } from './feature';
import { FeatureRegistry } from './feature/feature-registry';

/**
 * Web components bootstrap configuration.
 *
 * This can be passed to `bootstrapComponents()` function in order to customize components bootstrap.
 */
export interface BootstrapConfig {

  /**
   * A window instance custom components are registered for.
   *
   * This instance is used to access `window.customElements` and HTML element classes.
   *
   * Current window instance is used if when this option is omitted.
   */
  window?: Window;

}

export function bootstrapComponents(...features: FeatureType[]): void;

export function bootstrapComponents(config: BootstrapConfig, ...features: FeatureType[]): void;

/**
 * Bootstraps web components.
 *
 * Note that both features and components can be passed as parameters to this function, as components are features too.
 * Components would be defined only when all features enabled.
 *
 * @param config Custom bootstrap configuration.
 * @param features Web features and components to enable.
 */
export function bootstrapComponents(config?: BootstrapConfig | FeatureType, ...features: FeatureType[]): void {
  if (!config) {
    config = {};
  } else if (typeof config === 'function') {
    features = [ config, ...features ];
    config = {};
  }

  const featureRegistry = FeatureRegistry.create();

  features.forEach(feature => featureRegistry.add(feature));

  const { componentRegistry, bootstrapContext } = initBootstrap(config);

  featureRegistry.configure(bootstrapContext);

  componentRegistry.complete();
}

function initBootstrap(config: BootstrapConfig) {

  const providerRegistry = ProviderRegistry.create();
  const elementBuilder = ElementBuilder.create({ window: config.window, providerRegistry });
  const componentRegistry = ComponentRegistry.create({ builder: elementBuilder });

  class Context implements BootstrapContext {

    readonly onComponentDefinition = componentRegistry.componentDefinitions.on;
    readonly onElementDefinition = componentRegistry.elementDefinitions.on;
    readonly onElement = elementBuilder.elements.on;

    define<T extends object>(componentType: ComponentType<T>) {
      componentRegistry.define(componentType);
    }

    whenDefined(componentType: ComponentType<any, any>): PromiseLike<void> {
      return componentRegistry.whenDefined(componentType);
    }

    provide<S>(key: ContextValueKey<any, S>, provider: ComponentValueProvider<S>): void {
      providerRegistry.provide(key, provider);
    }

  }

  return { componentRegistry, bootstrapContext: new Context() };
}
