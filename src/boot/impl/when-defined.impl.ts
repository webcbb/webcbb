import { OnEvent, onPromise } from '@proc7ts/fun-events';
import { hasOwnProperty } from '@proc7ts/primitives';
import { ComponentClass, CustomElements, DefinitionContext } from '../../component/definition';
import { BootstrapContext } from '../bootstrap-context';
import { definitionContextOf } from './definition-context.symbol.impl';

/**
 * @internal
 */
export const WhenDefined__symbol = (/*#__PURE__*/ Symbol('WhenDefined'));

interface WhenDefinedComponentClass<T extends object> extends ComponentClass<T> {
  [WhenDefined__symbol]?: OnEvent<[DefinitionContext<T>]>;
}

/**
 * @internal
 */
export function whenDefined<T extends object>(
    bsContext: BootstrapContext,
    componentType: WhenDefinedComponentClass<T>,
): OnEvent<[DefinitionContext<T>]> {
  if (hasOwnProperty(componentType, WhenDefined__symbol)) {
    return componentType[WhenDefined__symbol] as OnEvent<[DefinitionContext<T>]>;
  }

  const result: OnEvent<[DefinitionContext<T>]> = onPromise(
      Promise.resolve(bsContext.whenReady)
          .then(() => bsContext.get(CustomElements).whenDefined(componentType))
          .then(() => definitionContextOf(componentType)),
  );

  return componentType[WhenDefined__symbol] = result;
}
