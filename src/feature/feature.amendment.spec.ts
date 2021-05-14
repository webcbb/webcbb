import { FeatureContext } from './feature-context';
import { FeatureDef } from './feature-def';
import { Feature } from './feature.amendment';

describe('feature', () => {
  describe('@Feature', () => {
    it('assigns feature definition', async () => {

      const init = jest.fn();
      const def: FeatureDef = { init };

      @Feature(def)
      class TestFeature {}

      const context: FeatureContext = { name: 'feature context' } as unknown as FeatureContext;

      await FeatureDef.of(TestFeature).init?.(context);

      expect(init).toHaveBeenCalledWith(context);
      expect(init.mock.instances[0]).toBe(def);
    });
    it('accepts an amendment as parameter', async () => {

      const init = jest.fn();
      const def: FeatureDef = { init };

      @Feature(({ amend }) => {
        amend()().amend(amend({ featureDef: def }));
      })
      class TestFeature {}

      const context: FeatureContext = { name: 'feature context' } as unknown as FeatureContext;

      await FeatureDef.of(TestFeature).init?.(context);

      expect(init).toHaveBeenCalledWith(context);
      expect(init.mock.instances[0]).toBe(def);
    });
  });
});