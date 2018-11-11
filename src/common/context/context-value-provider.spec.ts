import { ContextKey, ContextRequest, SingleContextKey } from './context-value';
import { ContextValueSpec } from './context-value-provider';
import { ContextValues } from './context-values';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;

describe('common/context/context-value-provider', () => {
  describe('ContextValueSpec', () => {
    describe('of', () => {

      let contextSpy: SpyObj<ContextValues>;

      beforeEach(() => {
        contextSpy = jasmine.createSpyObj('context', ['get']);
      });

      it('uses provider as is', () => {

        const spec: ContextValueSpec.ByProvider<ContextValues, string> = {
          a: new SingleContextKey<string>('value'),
          by: () => 'foo',
        };

        expect(ContextValueSpec.of(spec)).toBe(spec);
      });
      it('converts constant to provider', () => {

        const spec: ContextValueSpec.IsConstant<string> = {
          a: new SingleContextKey<string>('value'),
          is: 'foo',
        };
        const def = ContextValueSpec.of(spec);

        expect(def.a).toBe(spec.a);
        expect(def.by(contextSpy)).toBe(spec.is);
      });
      it('converts alias ro provider', () => {

        const aliasKey = new SingleContextKey<string>('alias-key');
        const spec: ContextValueSpec.ViaAlias<string> = {
          a: new SingleContextKey<string>('value'),
          via: aliasKey,
        };
        const def = ContextValueSpec.of(spec);

        const aliasValue = 'alias-value';

        contextSpy.get.and.callFake((request: ContextRequest<any>) => {
          if (request.key === aliasKey) {
            return aliasValue;
          }
          return;
        });

        expect(def.a).toBe(spec.a);
        expect(def.by(contextSpy)).toBe(aliasValue);
        expect(contextSpy.get).toHaveBeenCalledWith(aliasKey);
      });
      it('converts provider with dependencies to provider', () => {

        const key1 = new SingleContextKey<string>('arg1');
        const key2 = new SingleContextKey<number>('arg2');
        const spec: ContextValueSpec.ByProviderWithDeps<[string, number], string> = {
          a: new SingleContextKey<string>('value'),
          by(first: string, second: number) {
            return `${first}.${second}`;
          },
          with: [key1, key2],
        };
        const def = ContextValueSpec.of(spec);

        const arg1 = 'arg';
        const arg2 = 2;

        contextSpy.get.and.callFake((request: ContextRequest<any>) => {
          if (request.key === key1) {
            return arg1;
          }
          if (request.key === key2) {
            return arg2;
          }
          return;
        });

        expect(def.a).toBe(spec.a);
        expect(def.by(contextSpy)).toBe(`${arg1}.${arg2}`);
        expect(contextSpy.get).toHaveBeenCalledWith(key1);
        expect(contextSpy.get).toHaveBeenCalledWith(key2);
      });
      describe('as instance', () => {

        let constructorSpy: Spy;
        class Value {

          static readonly key: ContextKey<Value> = new SingleContextKey('value');

          constructor(...args: any[]) {
            constructorSpy(...args);
          }

          get some() {
            return 'some';
          }

        }

        class Val implements Value {

          constructor(...args: any[]) {
            constructorSpy(...args);
          }

          get some() {
            return 'other';
          }

        }

        beforeEach(() => {
          constructorSpy = jasmine.createSpy('constructor');
        });

        it('converts class to provider', () => {

          const spec: ContextValueSpec.AsInstance<ContextValues, Value> = {
            a: Value,
            as: Val,
          };

          const def = ContextValueSpec.of(spec);

          expect(def.a).toBe(spec.a);

          const value = def.by(contextSpy) as Value;

          expect(value).toEqual(jasmine.any(Val));
          expect(value.some).toBe('other');
          expect(constructorSpy).toHaveBeenCalledWith(contextSpy);
        });
        it('converts self class to provider', () => {

          const spec: ContextValueSpec.SelfInstance<ContextValues, Value> = { as: Value };
          const def = ContextValueSpec.of(spec);

          expect(def.a).toBe(spec.as);

          const value = def.by(contextSpy) as Value;

          expect(value).toEqual(jasmine.any(Value));
          expect(value.some).toBe('some');
          expect(constructorSpy).toHaveBeenCalledWith(contextSpy);
        });
        it('converts class with dependencies to provider', () => {

          const key1 = new SingleContextKey<string>('arg1');
          const key2 = new SingleContextKey<number>('arg2');
          const spec: ContextValueSpec.AsInstanceWithDeps<[string, number], Value> = {
            a: Value,
            as: Val,
            with: [key1, key2],
          };
          const def = ContextValueSpec.of(spec);

          const arg1 = 'arg';
          const arg2 = 2;

          contextSpy.get.and.callFake((request: ContextRequest<any>) => {
            if (request.key === key1) {
              return arg1;
            }
            if (request.key === key2) {
              return arg2;
            }
            return;
          });

          expect(def.a).toBe(spec.a);

          const value = def.by(contextSpy) as Value;

          expect(value).toEqual(jasmine.any(Val));
          expect(value.some).toBe('other');

          expect(constructorSpy).toHaveBeenCalledWith(arg1, arg2);
          expect(contextSpy.get).toHaveBeenCalledWith(key1);
          expect(contextSpy.get).toHaveBeenCalledWith(key2);
        });
        it('converts self class with dependencies to provider', () => {

          const key1 = new SingleContextKey<string>('arg1');
          const key2 = new SingleContextKey<number>('arg2');
          const spec: ContextValueSpec.SelfInstanceWithDeps<[string, number], Value> = {
            as: Value,
            with: [key1, key2],
          };
          const def = ContextValueSpec.of(spec);

          const arg1 = 'arg';
          const arg2 = 2;

          contextSpy.get.and.callFake((request: ContextRequest<any>) => {
            if (request.key === key1) {
              return arg1;
            }
            if (request.key === key2) {
              return arg2;
            }
            return;
          });

          expect(def.a).toBe(spec.as);

          const value = def.by(contextSpy) as Value;

          expect(value).toEqual(jasmine.any(Value));
          expect(value.some).toBe('some');
          expect(constructorSpy).toHaveBeenCalledWith(arg1, arg2);
          expect(contextSpy.get).toHaveBeenCalledWith(key1);
          expect(contextSpy.get).toHaveBeenCalledWith(key2);
        });
      });
      it('throws on unsupported spec', () => {

        const spec: ContextValueSpec<ContextValues, string> = {} as any;

        expect(() => ContextValueSpec.of(spec)).toThrow(jasmine.any(TypeError));
      });
    });
  });
});
