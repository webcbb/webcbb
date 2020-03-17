import { nextArgs, nextSkip, valueProvider } from 'call-thru';
import { ContextRegistry, ContextValues, ContextValueSpec, SingleContextKey, SingleContextRef } from 'context-values';
import { EventEmitter, EventReceiver, EventSupply, OnEvent, trackValue } from 'fun-events';
import { Class } from '../../common';
import { ComponentContext, ComponentDef } from '../../component';
import { ComponentClass, ComponentFactory, DefinitionContext, DefinitionSetup } from '../../component/definition';
import { BootstrapContext } from '../bootstrap-context';
import { bootstrapDefault } from '../bootstrap-default';
import { ComponentContextRegistry } from './component-context-registry.impl';
import { ComponentFactory$ } from './component-factory.impl';
import { customElementType } from './custom-element.impl';
import { DefinitionContextRegistry } from './definition-context-registry.impl';
import { postDefSetup } from './post-def-setup.impl';
import { WhenComponent } from './when-component.impl';

/**
 * @internal
 */
export interface ElementBuilder {
  readonly definitions: EventEmitter<[DefinitionContext]>;
  readonly components: EventEmitter<[ComponentContext]>;
  buildElement<T extends object>(this: void, componentType: ComponentClass<T>): ComponentFactory<T>;
}

/**
 * @internal
 */
export const ElementBuilder: SingleContextRef<ElementBuilder> = (/*#__PURE__*/ new SingleContextKey<ElementBuilder>(
    'element-builder',
    {
      byDefault: bootstrapDefault(newElementBuilder),
    },
));

function newElementBuilder(bsContext: BootstrapContext): ElementBuilder {

  const definitionContextRegistry$global = bsContext.get(DefinitionContextRegistry);
  const componentContextRegistry$global = bsContext.get(ComponentContextRegistry);
  const definitions = new EventEmitter<[DefinitionContext]>();
  const components = new EventEmitter<[ComponentContext]>();

  return {
    definitions,
    components,
    buildElement<T extends object>(componentType: ComponentClass<T>) {

      const def = ComponentDef.of(componentType);
      const whenComponent = new WhenComponent<T>();
      let componentContextRegistry$perType!: ComponentContextRegistry;
      const ready = trackValue(false);
      const whenReady: OnEvent<[]> = ready.read().thru(cls => cls ? nextArgs() : nextSkip());

      class DefinitionContext$ extends DefinitionContext<T> {

        readonly get: ContextValues['get'];

        get componentType(): ComponentClass<T> {
          return componentType;
        }

        get elementType(): Class {
          throw new Error('Custom element class is not constructed yet. Consider to use a `whenReady()` callback');
        }

        constructor() {
          super();

          const definitionContextRegistry = new DefinitionContextRegistry(
              definitionContextRegistry$global.seedIn(this),
          );

          definitionContextRegistry.provide({ a: DefinitionContext, is: this });
          definitionContextRegistry.provide({
            a: ComponentFactory,
            by: () => new ComponentFactory$<T>(
                this,
                () => componentContextRegistry$global.append(componentContextRegistry$perType),
                whenComponent,
                components,
            ),
          });
          this.get = definitionContextRegistry.newValues().get;
          componentContextRegistry$perType = new ComponentContextRegistry(definitionContextRegistry.seedIn(this));

          const whenReady$ = this.whenReady().F;
          const whenComponent$ = this.whenComponent().F;

          const definitionSetup: DefinitionSetup<T> = {
            get componentType() {
              return componentType;
            },
            get whenReady() {
              return whenReady$;
            },
            get whenComponent() {
              return whenComponent$;
            },
            perDefinition(spec) {
              return definitionContextRegistry.provide(spec);
            },
            perComponent(spec) {
              return componentContextRegistry$perType.provide(spec);
            },
          };

          def.setup?.(definitionSetup);
          postDefSetup(componentType).setup(definitionSetup);
        }

        whenReady(): OnEvent<[this]>;
        whenReady(receiver: EventReceiver<[this]>): EventSupply;
        whenReady(receiver?: EventReceiver<[this]>): EventSupply | OnEvent<[this]> {
          return (this.whenReady = (whenReady.thru_(valueProvider(this)).once() as OnEvent<[this]>).F)(receiver);
        }

        whenComponent(): OnEvent<[ComponentContext<T>]>;
        whenComponent(receiver: EventReceiver<[ComponentContext<T>]>): EventSupply;
        whenComponent(receiver?: EventReceiver<[ComponentContext<T>]>): OnEvent<[ComponentContext<T>]> | EventSupply {
          return (this.whenComponent = whenComponent.onCreated.F)(receiver);
        }

        perComponent<Deps extends any[], Src, Seed>(
            spec: ContextValueSpec<ComponentContext<T>, any, Deps, Src, Seed>,
        ): () => void {
          return componentContextRegistry$perType.provide(spec);
        }

      }

      const definitionContext = new DefinitionContext$();

      def.define?.(definitionContext);
      definitions.send(definitionContext);

      const elementType = customElementType(
          definitionContext,
          whenComponent,
          components,
          (): ContextRegistry<ComponentContext<T>> => componentContextRegistry$global.append(
              componentContextRegistry$perType),
      );

      Object.defineProperty(definitionContext, 'elementType', {
        configurable: true,
        enumerable: true,
        value: elementType,
      });

      ready.it = true;

      return definitionContext.get(ComponentFactory);
    },
  };

}
