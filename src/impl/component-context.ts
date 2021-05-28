import { AfterEvent, onceOn, OnEvent } from '@proc7ts/fun-events';
import { valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ComponentContext, ComponentContext__symbol, ComponentInstance } from '../component';
import { ComponentClass } from '../component/definition';
import { newComponent } from '../component/definition/component.impl';
import { ComponentStatus } from './component-status';
import { DefinitionContext$ } from './definition-context';

/**
 * @internal
 */
export abstract class ComponentContext$<T extends object> extends ComponentContext<T> {

  readonly get: ComponentContext<T>['get'];
  private readonly _status: ComponentStatus<this>;

  constructor(
      readonly _definitionContext: DefinitionContext$<T>,
      readonly element: any,
  ) {
    super();

    const registry = _definitionContext._newComponentRegistry();

    registry.provide({ a: ComponentContext, is: this });
    this.get = registry.newValues().get;
    this._status = new ComponentStatus(this);
    this.supply.whenOff(() => {
      delete this.component[ComponentContext__symbol];
      this._component = componentDestroyed;
    });
  }

  get componentType(): ComponentClass<T> {
    return this._definitionContext.componentType;
  }

  get component(): ComponentInstance<T> {
    return this._component();
  }

  get supply(): Supply {
    return this._status.supply;
  }

  get ready(): boolean {
    return this._status.isReady();
  }

  get onceReady(): OnEvent<[this]> {
    return this._status.onceReady();
  }

  get whenReady(): OnEvent<[this]> {
    return this._status.whenReady();
  }

  get settled(): boolean {
    return this._status.isSettled();
  }

  get onceSettled(): OnEvent<[this]> {
    return this._status.onceSettled();
  }

  get whenSettled(): OnEvent<[this]> {
    return this._status.whenSettled();
  }

  get connected(): boolean {
    return this._status.isConnected();
  }

  get onceConnected(): OnEvent<[this]> {
    return this._status.onceConnected();
  }

  get whenConnected(): OnEvent<[this]> {
    return this._status.whenConnected();
  }

  get readStatus(): AfterEvent<[this]> {
    return this._status.read();
  }

  _component(): T {
    throw new TypeError('Component is not constructed yet. Consider to use a `whenReady()` callback');
  }

  settle(): void {
    this._status.settle();
  }

  _createComponent(): this {

    const whenComponent = this._definitionContext._whenComponent;

    let lastRev = 0;

    whenComponent.readNotifier.do(onceOn)(notifier => lastRev = notifier(this, lastRev));
    this.whenConnected(() => {
      whenComponent.readNotifier({
        supply: new Supply().needs(this),
        receive: (_, notifier) => {
          lastRev = notifier(this, lastRev);
        },
      });
    });
    this._definitionContext._elementBuilder.components.send(this);

    const component = newComponent(this);

    this._component = valueProvider(component);
    this._status.ready();

    return this;
  }

  _connect(): void {
    this._status.connect();
  }

  _created(): void {
    this._status.create();
  }

}

/**
 * @internal
 */
export class ComponentContext$Mounted<T extends object> extends ComponentContext$<T> {

  get mounted(): true {
    return true;
  }

}

function componentDestroyed(): never {
  throw new TypeError('Component destroyed already');
}