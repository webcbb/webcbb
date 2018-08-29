import { Class } from '../common';
import { ComponentDef } from '../component';
import { ComponentDecorator } from './component-decorators';

/**
 * Web component class decorator.
 *
 * Decorate a class with it to define it as a web component like this:
 * ```TypeScript
 * @WebComponent({ name: 'my-element' })
 * class MyComponent {
 *   // ...
 * }
 * ```
 *
 * Such component can be registered with `BootstrapContext.define()` method, or used as a feature, e.g. passed to
 * `bootstrapComponents()` method, or added to `FeatureDef.requires` property of another feature.
 *
 * This is an alternative to direct call to `ComponentDef.define()` method.
 *
 * @param <T> A type of web component.
 * @param <E> A type of HTML element this web component extends.
 * @param def Web component definition or just custom HTML element name.
 *
 * @returns A web component class decorator.
 */
export function WebComponent<
    T extends Class = Class<any>,
    E extends HTMLElement = HTMLElement>(def: ComponentDef<InstanceType<T>, E> | string): ComponentDecorator<T> {
  return (type: T) => ComponentDef.define(type, typeof def === 'string' ? { name: def } : def);
}
