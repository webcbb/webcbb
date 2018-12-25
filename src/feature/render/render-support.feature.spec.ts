import { Class } from '../../common';
import { Component, ComponentClass, ComponentContext } from '../../component';
import { CustomElements } from '../../component/definition';
import { BootstrapWindow } from '../../kit';
import { bootstrapComponents } from '../../kit/bootstrap';
import { Feature } from '../feature.decorator';
import { RenderScheduler } from './render-scheduler';
import { RenderSupport } from './render-support.feature';
import Mocked = jest.Mocked;

describe('feature/render/render-support.feature', () => {
  describe('RenderSupport', () => {

    let windowSpy: Mocked<Window>;
    let customElementsSpy: Mocked<CustomElements>;

    beforeEach(() => {
      windowSpy = {
        requestAnimationFrame: jest.fn(),
      } as any;
      customElementsSpy = {
        define: jest.fn(),
      } as any;
    });

    let testComponent: ComponentClass;
    let elementType: Class;

    beforeEach(() => {
      @Component({
        name: 'test-component',
        extend: {
          type: Object,
        },
        define(ctx) {
          ctx.whenReady(() => {
            elementType = ctx.elementType;
          });
        },
      })
      class TestComponent {}

      testComponent = TestComponent;
    });

    beforeEach(() => {

      @Feature({
        need: [RenderSupport, testComponent],
        set: [
          { a: BootstrapWindow, is: windowSpy },
          { a: CustomElements, is: customElementsSpy },
        ]
      })
      class TestFeature {}

      bootstrapComponents(TestFeature);
    });

    describe('RenderScheduler', () => {

      let componentContext: ComponentContext;
      let renderScheduler: RenderScheduler;

      beforeEach(() => {

        const element = new elementType;

        componentContext = ComponentContext.of(element);
        renderScheduler = componentContext.get(RenderScheduler);
      });

      it('is available to component', () => {
        expect(renderScheduler).toBeDefined();
      });

      describe('scheduleRender', () => {
        it('requests animation frame', () => {

          const renderSpy = jest.fn();

          renderScheduler.scheduleRender(renderSpy);

          expect(windowSpy.requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));
          expect(renderSpy).not.toHaveBeenCalled();

          windowSpy.requestAnimationFrame.mock.calls[0][0]();

          expect(renderSpy).toHaveBeenCalled();
        });
        it('does not request animation frame for the second time', () => {

          const render1spy = jest.fn();
          const render2spy = jest.fn();

          renderScheduler.scheduleRender(render1spy);
          renderScheduler.scheduleRender(render2spy);

          expect(windowSpy.requestAnimationFrame).toHaveBeenCalledTimes(1);
        });
        it('renders with the latest scheduled renderer', () => {

          const render1spy = jest.fn();
          const render2spy = jest.fn();

          renderScheduler.scheduleRender(render1spy);
          renderScheduler.scheduleRender(render2spy);

          windowSpy.requestAnimationFrame.mock.calls[0][0]();

          expect(render1spy).not.toHaveBeenCalled();
          expect(render2spy).toHaveBeenCalled();
        });
        it('allows to re-render', () => {

          const render1spy = jest.fn();

          renderScheduler.scheduleRender(render1spy);

          windowSpy.requestAnimationFrame.mock.calls[0][0]();

          expect(render1spy).toHaveBeenCalled();

          const render2spy = jest.fn();

          renderScheduler.scheduleRender(render2spy);

          windowSpy.requestAnimationFrame.mock.calls[0][0]();

          expect(render2spy).toHaveBeenCalled();
        });
      });
    });
  });
});