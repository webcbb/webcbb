import { Component, ComponentContext } from '../component';
import { ComponentClass } from '../component/definition';
import { Feature } from '../feature';
import { MockElement, testElement } from './test-element';
import Mock = jest.Mock;

describe('component instantiation', () => {
  describe('Life cycle', () => {

    let testComponent: ComponentClass;
    let constructorSpy: Mock;
    let context: ComponentContext;
    let componentListenerSpy: Mock;
    let element: any;

    beforeEach(() => {
      context = undefined!;
      constructorSpy = jest.fn((ctx: ComponentContext) => context = ctx);
      componentListenerSpy = jest.fn();

      @Component({
        name: 'test-component',
        extend: {
          type: class extends MockElement {
            get inheritedProperty() {
              return 'inherited-value';
            }
          },
        },
      })
      @Feature({
        init(bootCtx) {
          bootCtx.onComponent(componentListenerSpy);
        },
      })
      class TestComponent {

        constructor(...args: any[]) {
          constructorSpy(...args);
        }

      }

      testComponent = TestComponent;
    });
    beforeEach(async () => {
      element = new (await testElement(testComponent))();
    });

    it('instantiates custom element', async () => {
      expect(element).toBeDefined();
    });
    it('assigns component context reference to custom element', () => {
      expect(ComponentContext.of(element)).toBe(context);
    });
    it('assigns component context reference to component', () => {
      expect(ComponentContext.of(context.component)).toBe(context);
    });
    it('passes context to component', () => {

      const expectedContext: Partial<ComponentContext> = {
        element,
      };

      expect(constructorSpy).toHaveBeenCalledWith(expect.objectContaining(expectedContext));
    });
    it('uses custom element as content root', () => {
      expect(context.contentRoot).toBe(element);
    });
    it('sets component type', () => {
      expect(context.componentType).toBe(testComponent);
    });
    it('allows to access inherited element properties', () => {
      expect(context.elementSuper('inheritedProperty')).toEqual('inherited-value');
    });

    describe('onComponent listener', () => {
      it('is notified on new element instantiation', () => {
        expect(componentListenerSpy).toHaveBeenCalledWith(context);
      });
    });
  });

  describe('context callbacks', () => {
    describe('component', () => {
      it('is resolved on component instantiation', async () => {

        let context!: ComponentContext;
        const component = await new Promise(async resolve => {

          @Component({
            name: 'test-component',
            extend: {
              type: MockElement,
            },
          })
          @Feature({
            init(featureCtx) {
              featureCtx.onComponent(ctx => {
                context = ctx;
                expect(() => context.component).toThrow(/not constructed yet/);
                ctx.whenReady(comp => resolve(comp));
              });
            },
          })
          class TestComponent {
          }

          new (await testElement(TestComponent))(); // tslint:disable-line:no-unused-expression
        });

        expect(component).toBeDefined();
        expect(context.component).toBe(component);

        const ready = jest.fn();

        context.whenReady(ready);

        expect(ready).toHaveBeenCalledWith(component);
      });
    });

    describe('whenOn listener', () => {
      it('is notified when custom element connected', async () => {

        const listenerSpy = jest.fn();

        @Component({
          name: 'test-component',
          extend: {
            type: MockElement,
          },
        })
        class TestComponent {

          constructor(ctx: ComponentContext) {
            ctx.whenOn(listenerSpy);
            ctx.whenOn(() => expect(ctx.connected).toBe(true));
          }

        }

        const element: any = new (await testElement(TestComponent))();

        element.connectedCallback();

        expect(listenerSpy).toHaveBeenCalled();
      });
    });

    describe('whenOff listener', () => {
      it('is notified when custom element disconnected', async () => {

        const listenerSpy = jest.fn();

        @Component({
          name: 'test-component',
          extend: {
            type: MockElement,
          },
        })
        class TestComponent {

          constructor(ctx: ComponentContext) {
            ctx.whenOff(listenerSpy);
            ctx.whenOff(() => expect(ctx.connected).toBe(false));
          }

        }

        const element: any = new (await testElement(TestComponent))();

        expect(listenerSpy).not.toHaveBeenCalled();

        element.disconnectedCallback();

        expect(listenerSpy).toHaveBeenCalled();
      });
    });
  });
});
