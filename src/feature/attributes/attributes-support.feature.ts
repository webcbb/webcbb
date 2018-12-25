import { SingleContextKey } from 'context-values';
import { Class, mergeFunctions } from '../../common';
import { ComponentContext } from '../../component';
import { Feature } from '../feature.decorator';
import { AttributeChangedCallback, AttributeRegistrar } from './attribute-registrar';

class AttributeRegistry<T extends object> {

  static readonly key = new SingleContextKey<AttributeRegistry<any>>('attribute-registry');
  private readonly _attrs: { [name: string]: AttributeChangedCallback<T> } = {};

  onAttributeChange(name: string, callback: AttributeChangedCallback<T>): void {
    this._attrs[name] = mergeFunctions<[string, string | null], void, T>(this._attrs[name], callback);
  }

  apply(elementType: Class) {

    const attrs = this._attrs;
    const observedAttributes = Object.keys(attrs);

    if (!observedAttributes.length) {
      return; // No attributes defined
    }

    Object.defineProperty(elementType, 'observedAttributes', {
      configurable: true,
      enumerable: true,
      value: observedAttributes,
    });
    Object.defineProperty(elementType.prototype, 'attributeChangedCallback', {
      configurable: true,
      enumerable: true,
      value: function (name: string, oldValue: string | null, newValue: string) {
        (attrs[name] as any).call(ComponentContext.of(this).component, newValue, oldValue);
      },
    });
  }

}

/**
 * A feature adding attributes to custom elements.
 *
 * This feature is enabled automatically whenever an `@Attribute`, `@Attributes`, or `@AttributeChanged` decorator
 * applied to component.
 */
@Feature({
  init(context) {
    context.forDefinitions({ as: AttributeRegistry });
    context.forDefinitions({
      a: AttributeRegistrar,
      by(registry: AttributeRegistry<any>) {
        return <T extends object>(name: string, callback: AttributeChangedCallback<T>) =>
            registry.onAttributeChange(name, callback);
      },
      with: [AttributeRegistry],
    });
    context.onDefinition(ctx => ctx.whenReady(elementType => ctx.get(AttributeRegistry).apply(elementType)));
  },
})
export class AttributesSupport {}