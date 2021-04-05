import { BootstrapContext } from '../../boot';
import { Component, ComponentContext, ComponentSlot, ContentRoot } from '../../component';
import { ComponentClass } from '../../component/definition';
import { MockElement, testElement } from '../../spec/test-element';
import { AttachShadow, ShadowContentDef } from './attach-shadow.decorator';
import { ShadowContentRoot } from './shadow-content-root';
import { ShadowRootBuilder } from './shadow-root-builder';
import Mock = jest.Mock;

describe('feature/shadow-dom', () => {
  describe('@AttachShadow', () => {

    let testComponent: ComponentClass;
    let attachShadowSpy: Mock;
    let shadowRoot: ShadowContentRoot;
    let element: any;
    let context: ComponentContext;

    beforeEach(() => {
      shadowRoot = { name: 'shadowRoot' } as any;
      attachShadowSpy = jest.fn(() => shadowRoot);

      @AttachShadow()
      @Component({
        name: 'test-component',
        extend: {
          type: class extends MockElement {

            attachShadow = attachShadowSpy;

          },
        },
      })
      class TestComponent {
      }

      testComponent = TestComponent;
    });
    beforeEach(async () => {
      element = new (await testElement(testComponent))();
      context = await ComponentSlot.of(element).whenReady;
    });

    it('makes shadow root builder available in bootstrap context', () => {
      expect(context.get(BootstrapContext).get(ShadowRootBuilder)).toBeDefined();
    });
    it('provides shadow root', () => {
      expect(context.get(ShadowContentRoot)).toBe(shadowRoot);
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
    it('attaches shadow root', async () => {

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
        },
      })
      class OtherComponent {
      }

      element = new (await testElement(OtherComponent))();

      const context = await ComponentSlot.of(element).whenReady;

      context.get(ShadowContentRoot);
      expect(attachShadowSpy).toHaveBeenCalledWith(shadowDef);
    });
    it('uses existing shadow root', async () => {
      attachShadowSpy.mockClear();

      const mockShadowRoot: ShadowRoot = { name: 'shadow root' } as any;

      @AttachShadow()
      @Component({
        name: 'other-component',
        extend: {
          type: class extends MockElement {

            attachShadow = attachShadowSpy;

          },
        },
      })
      class OtherComponent {

        constructor(ctx: ComponentContext) {
          ctx.element.shadowRoot = mockShadowRoot;
        }

      }

      element = new (await testElement(OtherComponent))();

      const context = await ComponentSlot.of(element).whenReady;

      expect(context.get(ShadowContentRoot)).toBe(mockShadowRoot);
      expect(attachShadowSpy).not.toHaveBeenCalled();
    });
    it('uses element as content root if shadow DOM is not supported', async () => {
      attachShadowSpy.mockClear();

      const shadowDef: ShadowContentDef = {
        mode: 'closed',
      };

      @AttachShadow(shadowDef)
      @Component({
        name: 'other-component',
        extend: {
          type: MockElement,
        },
      })
      class OtherComponent {
      }

      element = new (await testElement(OtherComponent))();
      context = await ComponentSlot.of(element).whenReady;

      expect(context.get(ShadowContentRoot, { or: null })).toBeNull();
      expect(context.get(ContentRoot)).toBe(element);
    });
  });
});
