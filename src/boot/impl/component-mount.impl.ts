import { ComponentMount } from '../../component';
import { ComponentContext$ } from './component-context.impl';
import { DefinitionContext$ } from './definition-context.impl';

class ComponentMount$<T extends object> extends ComponentMount<T> {

  constructor(readonly context: ComponentContext$<T>) {
    super();
  }

  get connected(): boolean {
    return this.context.connected;
  }

  connect(): void {
    this.context._connect();
  }

  checkConnected(): boolean {

    const el = this.context.element as Element;
    const doc = el.ownerDocument;
    const connected = doc != null && doc.contains(el);

    if (connected !== this.connected) {
      if (connected) {
        this.connect();
      } else {
        this.context.destroy();
      }
    }

    return connected;
  }

}

/**
 * @internal
 */
export class MountComponentContext$<T extends object> extends ComponentContext$<T> {

  readonly mount: ComponentMount<T>;

  constructor(definitionContext: DefinitionContext$<T>, element: any) {
    super(definitionContext, element);
    this.mount = this.mount = new ComponentMount$<T>(this);
  }

}