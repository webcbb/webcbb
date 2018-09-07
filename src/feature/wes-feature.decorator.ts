import { TypedClassDecorator } from '../common';
import { FeatureDef, FeatureType } from './feature';

/**
 * Web components feature class decorator.
 *
 * Decorate a class with it to define it as a web components feature like this:
 * ```TypeScript
 * @WesFeature({ requires: [OtherFeature, MyComponent] })
 * class MyFeature {
 *   // ...
 * }
 * ```
 *
 * Such feature can be passed to `bootstrapComponents()` function or referenced by other features.
 *
 * This is an alternative to direct call to `FeatureDef.define()` method.
 *
 * @param <T> A type of web components feature.
 * @param def Web components feature definition.
 *
 * @returns A web components feature class decorator.
 */
export function WesFeature<T extends FeatureType = any>(def: FeatureDef): TypedClassDecorator<T> {
  return (type: T) => FeatureDef.define(type, def);
}