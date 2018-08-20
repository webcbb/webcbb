import { ComponentDef, ComponentType } from '../component';
import { ElementBuilder } from './element-builder';
import { ProviderRegistry } from './provider-registry';

describe('element/element-builder', () => {
  describe('ElementBuilder', () => {

    let providerRegistry: ProviderRegistry;
    let builder: ElementBuilder;

    beforeEach(() => {
      providerRegistry = ProviderRegistry.create();
      builder = ElementBuilder.create({ providerRegistry });
    });

    describe('buildElement', () => {

      let TestComponent: ComponentType;

      beforeEach(() => {
        TestComponent = class {
          static [ComponentDef.symbol]: ComponentDef = {
            name: 'test-component',
          };
        };
      });

      it('builds HTML element', () => {
        expect(builder.buildElement(TestComponent).prototype).toEqual(jasmine.any(HTMLElement));
      });
      it('extends HTML element', () => {
        ComponentType.define(TestComponent, {
          extend: {
            name: 'input',
            type: HTMLInputElement,
          },
        });

        expect(builder.buildElement(TestComponent).prototype).toEqual(jasmine.any(HTMLInputElement));
      });
      it('applies properties', () => {
        ComponentType.define(TestComponent, {
          properties: {
            testProperty: {
              value: 'test value',
            },
          },
        });

        const element = builder.buildElement(TestComponent);

        expect<any>(element.prototype).toEqual(jasmine.objectContaining({
          testProperty: 'test value',
        }));
      });
    });
  });
});
