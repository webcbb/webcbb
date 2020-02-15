/**
 * @packageDocumentation
 * @module @wesib/wesib
 */
import { ComponentProperty, ComponentPropertyDecorator } from '../../component';
import { ComponentClass } from '../../component/definition';
import { StateSupport } from '../state';
import { ElementRender } from './element-render';
import { RenderDef } from './render-def';

/**
 * Component property decorator that declares a rendering method for the component.
 *
 * The decorated method call will be scheduled by [[DefaultRenderScheduler]] once component state updated.
 *
 * The decorated method should have no arguments. It may return either nothing, or a function. In the latter case the
 * returned function will be called immediately to render the element. It may, in turn, return a renderer function,
 * and so on.
 *
 * This decorator automatically enables [[StateSupport]] feature.
 *
 * Utilizes [[ElementRender.render]] function to define rendering.
 *
 * @category Feature
 * @typeparam T  A type of decorated component class.
 * @param def  Non-mandatory render definition.
 *
 * @returns Component method decorator.
 */
export function Render<T extends ComponentClass>(
    def?: RenderDef,
): ComponentPropertyDecorator<() => any, T> {
  return ComponentProperty(({ get }) => ({
    componentDef: {
      feature: {
        needs: StateSupport,
      },
      define(defContext) {
        defContext.whenComponent(context => {
          context.whenReady(() => {

            const { component } = context;

            ElementRender.render(context, get(component).bind(component), def);
          });
        });
      },
    },
  }));
}
