import { DomEventDispatcher } from 'fun-events';
import { Component, ComponentClass, ComponentContext, ComponentEventDispatcher, ContentRoot } from '../../component';
import { ObjectMock } from '../../spec/mocks';
import { MockElement, testElement } from '../../spec/test-element';
import { FeatureDef } from '../feature-def';
import { Feature } from '../feature.decorator';
import { AttachShadow } from './attach-shadow.decorator';
import { ShadowContentDef } from './shadow-content-def';
import { ShadowContentRoot } from './shadow-content-root';
import { ShadowDomEvent } from './shadow-dom-event';
import { ShadowDomSupport } from './shadow-dom-support.feature';
import Mock = jest.Mock;

describe('feature/shadow-dom/attach-shadow.decorator', () => {
  describe('@AttachShadow', () => {

    let testComponent: ComponentClass;
    let attachShadowSpy: Mock;
    let shadowRoot: ShadowContentRoot;
    let mockDispatcher: ObjectMock<ComponentEventDispatcher>;
    let element: any;
    let context: ComponentContext;

    beforeEach(() => {
      shadowRoot = { name: 'shadowRoot' } as any;
      attachShadowSpy = jest.fn(() => shadowRoot);
      mockDispatcher = {
        dispatch: jest.fn(),
        on: jest.fn((ctx: ComponentContext, type: string) =>
            new DomEventDispatcher(ctx.element).on<any>(type)),
      };

      @AttachShadow()
      @Component({
        name: 'test-component',
        extend: {
          type: class extends MockElement {
            attachShadow = attachShadowSpy;
          },
        }
      })
      @Feature({
        set: { a: ComponentEventDispatcher, is: mockDispatcher },
      })
      class TestComponent {
      }

      testComponent = TestComponent;
    });
    beforeEach(() => {
      element = new (testElement(testComponent))();
      context = ComponentContext.of(element);
    });

    it('enables shadow root support', () => {
      expect(FeatureDef.of(testComponent).needs).toBe(ShadowDomSupport);
    });
    it('provides shadow root', () => {
      expect(context.get(ShadowContentRoot)).toBe(shadowRoot);
    });
    it('assigns component context to shadow root', () => {
      expect(ComponentContext.of(context.get(ShadowContentRoot))).toBe(context);
    });
    it('provides shadow root as content root', () => {
      expect(context.contentRoot).toBe(shadowRoot);
    });
    it('does not eagerly attaches shadow root', () => {
      expect(attachShadowSpy).not.toHaveBeenCalled();
    });
    it('attaches open shadow root by default', () => {
      context.get(ShadowContentRoot);
      expect(attachShadowSpy).toHaveBeenCalledWith({ mode: 'open' });
    });
    it('dispatches shadow DOM event', () => {
      context.get(ShadowContentRoot);
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
          context,
          expect.any(ShadowDomEvent));
      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
          context,
          expect.objectContaining({ type: 'wesib:shadowAttached' }));
    });
    it('attaches shadow root', () => {

      const shadowDef: ShadowContentDef = {
        mode: 'closed',
      };

      @AttachShadow(shadowDef)
      @Component({
        name: 'other-component',
        extend: {
          type: class extends MockElement {
            attachShadow = attachShadowSpy;
          },
        }
      })
      class OtherComponent {
      }

      element = new (testElement(OtherComponent))();
      ComponentContext.of(element).get(ShadowContentRoot);

      expect(attachShadowSpy).toHaveBeenCalledWith(shadowDef);
    });
    it('uses existing shadow root', () => {
      attachShadowSpy.mockClear();

      const mockShadowRoot: ShadowRoot = { name: 'shadow root' } as any;

      @AttachShadow()
      @Component({
        name: 'other-component',
        extend: {
          type: class extends MockElement {
            attachShadow = attachShadowSpy;
          },
        }
      })
      class OtherComponent {

        constructor(ctx: ComponentContext) {
          ctx.element.shadowRoot = mockShadowRoot;
        }

      }

      element = new (testElement(OtherComponent))();

      expect(ComponentContext.of(element).get(ShadowContentRoot)).toBe(mockShadowRoot);
      expect(attachShadowSpy).not.toHaveBeenCalled();
    });
    it('uses element as content root if shadow DOM is not supported', () => {
      attachShadowSpy.mockClear();

      const shadowDef: ShadowContentDef = {
        mode: 'closed',
      };

      @AttachShadow(shadowDef)
      @Component({
        name: 'other-component',
        extend: {
          type: MockElement,
        }
      })
      class OtherComponent {
      }

      element = new (testElement(OtherComponent))();
      context = ComponentContext.of(element);

      expect(context.get(ShadowContentRoot, { or: null })).toBeNull();
      expect(context.get(ContentRoot)).toBe(element);
    });
  });
});
