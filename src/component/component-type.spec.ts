import { FeatureDef } from '../feature';
import { ComponentDef, PartialComponentDef } from './component-def';
import { ComponentType } from './component-type';

describe('component/component-type', () => {
  describe('ComponentDef', () => {
    describe('of', () => {
      it('returns component definition', () => {

        class TestComponent {
          static [ComponentDef.symbol] = {
            name: 'test-component',
          };
        }

        expect(ComponentDef.of(TestComponent)).toEqual(TestComponent[ComponentDef.symbol]);
      });
      it('fails when there is no component definition', () => {

        class TestComponent {
        }

        expect(() => ComponentDef.of(TestComponent)).toThrow(jasmine.any(TypeError));
      });
    });
  });

  describe('ComponentType', () => {
    describe('define', () => {

      let TestComponent: ComponentType;

      beforeEach(() => {
        TestComponent = class {};
      });

      it('assigns component definition', () => {

        const def: ComponentDef = { name: 'test-component' };
        const componentType = ComponentType.define(TestComponent, def);

        expect(ComponentDef.of(componentType)).toEqual(def);
      });
      it('updates component definition', () => {

        const initialDef: ComponentDef = {
          name: 'test',
        };

        ComponentType.define(TestComponent, initialDef);

        const def: PartialComponentDef = {
          properties: {
            test: {
              value: 'some',
            },
          },
        };
        const componentType = ComponentType.define(TestComponent, def);

        expect<PartialComponentDef>(ComponentDef.of(componentType)).toEqual(ComponentDef.merge(initialDef, def));
      });
      it('creates feature', () => {

        const componentType = ComponentType.define(TestComponent, { name: 'test-component' });
        const featureDef = FeatureDef.of(componentType)!;

        expect(featureDef).toBeDefined();

        const configure = featureDef.configure!;

        expect(configure).toBeDefined();

        const featureContextSpy = jasmine.createSpyObj('bootstrapContext', ['define']);

        configure(featureContextSpy);

        expect(featureContextSpy.define).toHaveBeenCalledWith(componentType);
      });
    });
  });
});
