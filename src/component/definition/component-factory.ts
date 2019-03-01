import { ContextKey, SingleContextKey } from 'context-values';
import { Class } from '../../common';
import { ComponentClass } from '../component-class';
import { ComponentMount } from '../component-mount';
import { ElementDef } from './element-def';

const KEY = /*#__PURE__*/ new SingleContextKey<ComponentFactory<any>>('component-factory');

/**
 * A factory of components of particular type.
 */
export abstract class ComponentFactory<C extends object = object> {

  /**
   * A key of definition context value containing a component factory.
   */
  static get key(): ContextKey<ComponentFactory<any>> {
    return KEY;
  }

  /**
   * Component class constructor.
   */
  abstract readonly componentType: ComponentClass<C>;

  /**
   * Custom element class constructor.
   *
   * It is an error accessing this property before the element class is created, e.g. from inside of
   * `DefinitionListener` or `ComponentDef.define()` function. In these cases you may wish to add a `whenReady()`
   * callback.
   */
  abstract readonly elementType: Class;

  /**
   * Custom element definition.
   */
  abstract readonly elementDef: ElementDef;

  /**
   * Mounts a component to arbitrary element.
   *
   * This method creates a component, but instead of creating a custom element for, it mounts it to the target
   * `element`.
   *
   * It is up to the features to update the target element. They can use a `ComponentContext.mount` property to check
   * whether the component is mounted or is constructed in standard way.
   *
   * The constructed component will be in disconnected state. To update its connection state either update a
   * `ComponentMount.connected` property, or use a `connectTo()` method.
   *
   * @param element Target element to mount new component to.
   *
   * @returns New component mount.
   *
   * @throws Error If target element is already bound to some component.
   */
  abstract mountTo(element: any): ComponentMount<C>;

  /**
   * Connects a component to arbitrary element.
   *
   * This method does the same as `mountTo()`, but also marks the mounted component as connected.
   *
   * @param element Target element to mount new component to.
   *
   * @returns New component mount.
   *
   * @throws Error If target element is already bound to some component.
   */
  connectTo(element: any): ComponentMount<C> {

    const mount = this.mountTo(element);

    mount.connected = true;

    return mount;
  }

}
