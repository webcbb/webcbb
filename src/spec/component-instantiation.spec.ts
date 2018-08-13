import { componentOf, ComponentType, ElementRef } from '../component';
import { ElementProperty, WebComponent } from '../decorators';
import { TestComponentRegistry } from './test-component-registry';
import Spy = jasmine.Spy;

describe('component instantiation', () => {

  let registry: TestComponentRegistry;
  let TestComponent: ComponentType;
  let constructorSpy: Spy;
  let elementRef: ElementRef<HTMLElement>;
  let attrChangedSpy: Spy;
  let attr2ChangedSpy: Spy;
  let element: HTMLElement;
  let propertyValue: number;

  beforeEach(async () => {
    registry = await new TestComponentRegistry().create();
  });
  afterEach(() => registry.dispose());

  beforeEach(() => {
    elementRef = undefined!;
    constructorSpy = jasmine.createSpy('constructor').and.callFake((ref: ElementRef<HTMLElement>) => elementRef = ref);
    attrChangedSpy = jasmine.createSpy('attrChanged');
    attr2ChangedSpy = jasmine.createSpy('attr2Changed');
    propertyValue = 0;

    @WebComponent({
      name: 'custom-component',
      attributes: {
        'custom-attribute': attrChangedSpy,
        'custom-attribute-2': attr2ChangedSpy,
      },
      properties: {
        tagName: {
          value: 'MODIFIED-CUSTOM-COMPONENT',
        }
      },
    })
    class Component {
      constructor(...args: any[]) {
        constructorSpy(...args);
      }

      @ElementProperty()
      get readonlyProperty() {
        return propertyValue;
      }

      get writableProperty() {
        return propertyValue;
      }

      @ElementProperty({ name: 'otherProperty' })
      set writableProperty(value: number) {
        propertyValue = value;
      }

    }

    TestComponent = Component;
  });
  beforeEach(async () => {
    element = await registry.addElement(TestComponent);
  });

  it('instantiates custom element', async () => {
    expect(element).toBeDefined();
  });
  it('assigns component reference to custom element', () => {
    expect(componentOf(element)).toEqual(jasmine.any(TestComponent));
  });
  it('passes element reference to component', () => {

    const expectedRef: Partial<ElementRef> = {
      element,
    };

    expect(constructorSpy).toHaveBeenCalledWith(jasmine.objectContaining(expectedRef));
  });
  it('notifies on attribute change', () => {
    element.setAttribute('custom-attribute', 'value1');
    expect(attrChangedSpy).toHaveBeenCalledWith(null, 'value1');

    attrChangedSpy.calls.reset();
    element.setAttribute('custom-attribute', 'value2');
    expect(attrChangedSpy).toHaveBeenCalledWith('value1', 'value2');
  });
  it('does not notify on other attribute change', () => {
    element.setAttribute('custom-attribute-2', 'value');
    expect(attrChangedSpy).not.toHaveBeenCalled();
    expect(attr2ChangedSpy).toHaveBeenCalled();
  });
  it('does not notify on non-declared attribute change', () => {
    element.setAttribute('title', 'test title');
    expect(attrChangedSpy).not.toHaveBeenCalled();
    expect(attr2ChangedSpy).not.toHaveBeenCalled();
  });
  it('defines properties', () => {
    expect(element.tagName).toEqual('MODIFIED-CUSTOM-COMPONENT');
  });
  it('allows to access inherited properties', () => {
    expect(elementRef.inherited('tagName')).toEqual('CUSTOM-COMPONENT');
  });
  it('reads element property', () => {
    expect((element as any).readonlyProperty).toBe(propertyValue);
    propertyValue = 1;
    expect((element as any).readonlyProperty).toBe(propertyValue);
  });
  it('writes element property', () => {
    expect((element as any).otherProperty).toBe(propertyValue);
    (element as any).otherProperty = 1;
    expect(propertyValue).toBe(1);
  });
});
