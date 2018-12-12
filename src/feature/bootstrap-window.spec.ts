import { ContextRegistry } from 'context-values';
import { BootstrapWindow } from './bootstrap-window';

describe('feature/bootstrap-window', () => {
  describe('BootstrapWindow', () => {
    it('defaults to window object', () => {

      const context = new ContextRegistry().newValues();

      expect(context.get(BootstrapWindow)).toBe(window);
    });
  });
});
