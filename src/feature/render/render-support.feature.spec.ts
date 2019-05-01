import { Class } from '../../common';
import { Component, ComponentClass, ComponentContext } from '../../component';
import { CustomElements } from '../../component/definition';
import { BootstrapContext, BootstrapWindow } from '../../kit';
import { ObjectMock } from '../../spec/mocks';
import { MockElement, testElement } from '../../spec/test-element';
import { FeatureDef } from '../feature-def';
import { Feature } from '../feature.decorator';
import { RenderSchedule, RenderScheduler } from './render-scheduler';
import { RenderSupport } from './render-support.feature';

describe('feature/render/render-support.feature', () => {
  describe('RenderSupport', () => {

    let windowSpy: ObjectMock<Window>;
    let customElementsSpy: ObjectMock<CustomElements>;

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
          type: MockElement,
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
        needs: [RenderSupport],
        set: [
          { a: BootstrapWindow, is: windowSpy },
          { a: CustomElements, is: customElementsSpy },
        ]
      })
      class TestFeature {}

      FeatureDef.define(testComponent, { needs: TestFeature });

      testElement(testComponent);
    });

    describe('RenderSchedule', () => {

      let componentContext: ComponentContext;
      let renderSchedule: RenderSchedule;

      beforeEach(() => {

        const element = new elementType;

        componentContext = ComponentContext.of(element);
        renderSchedule = componentContext.get(BootstrapContext).get(RenderScheduler).newSchedule();
      });

      describe('schedule', () => {
        it('requests animation frame', () => {

          const renderSpy = jest.fn();

          renderSchedule.schedule(renderSpy);

          expect(windowSpy.requestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));
          expect(renderSpy).not.toHaveBeenCalled();

          windowSpy.requestAnimationFrame.mock.calls[0][0](0);

          expect(renderSpy).toHaveBeenCalled();
        });
        it('does not request animation frame for the second time', () => {

          const render1spy = jest.fn();
          const render2spy = jest.fn();

          renderSchedule.schedule(render1spy);
          renderSchedule.schedule(render2spy);

          expect(windowSpy.requestAnimationFrame).toHaveBeenCalledTimes(1);
        });
        it('renders with the latest scheduled renderer', () => {

          const render1spy = jest.fn();
          const render2spy = jest.fn();

          renderSchedule.schedule(render1spy);
          renderSchedule.schedule(render2spy);

          windowSpy.requestAnimationFrame.mock.calls[0][0](0);

          expect(render1spy).not.toHaveBeenCalled();
          expect(render2spy).toHaveBeenCalled();
        });
        it('allows to re-render', () => {

          const render1spy = jest.fn();

          renderSchedule.schedule(render1spy);

          windowSpy.requestAnimationFrame.mock.calls[0][0](0);

          expect(render1spy).toHaveBeenCalled();

          const render2spy = jest.fn();

          renderSchedule.schedule(render2spy);

          windowSpy.requestAnimationFrame.mock.calls[0][0](0);

          expect(render2spy).toHaveBeenCalled();
        });
      });
    });
  });
});
