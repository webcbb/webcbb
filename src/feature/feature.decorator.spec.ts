import { noop } from '@proc7ts/primitives';
import { FeatureDef } from './feature-def';
import { Feature } from './feature.decorator';

describe('feature', () => {
  describe('@Feature', () => {
    it('assigns feature definition', () => {

      const def: FeatureDef = {
        init: noop,
      };

      @Feature(def)
      class TestFeature {}

      expect(FeatureDef.of(TestFeature)).toEqual(def);
    });
  });
});
