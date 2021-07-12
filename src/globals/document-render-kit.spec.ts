import { drekContextOf } from '@frontmeans/drek';
import { NamespaceAliaser, NamespaceDef, newNamespaceAliaser } from '@frontmeans/namespace-aliaser';
import { immediateRenderScheduler } from '@frontmeans/render-scheduler';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cxConstAsset } from '@proc7ts/context-builder';
import { bootstrapComponents } from '../bootstrap-components';
import { Feature } from '../feature';
import { DefaultRenderScheduler } from './default-render-scheduler';
import { DocumentRenderKit } from './document-render-kit';

describe('globals', () => {
  describe('DocumentRenderKit', () => {

    let doc: Document;

    beforeEach(() => {
      doc = document.implementation.createHTMLDocument('test');
    });

    let nsAlias: NamespaceAliaser;
    let scheduler: DefaultRenderScheduler;
    let renderKit: DocumentRenderKit;

    beforeEach(async () => {
      nsAlias = jest.fn(newNamespaceAliaser());
      scheduler = jest.fn(immediateRenderScheduler);

      @Feature({
        setup(setup) {
          setup.provide(cxConstAsset(NamespaceAliaser, nsAlias));
          setup.provide(cxConstAsset(DefaultRenderScheduler, scheduler));
        },
      })
      class TestFeature {}

      const bsContext = await bootstrapComponents(TestFeature).whenReady;

      renderKit = bsContext.get(DocumentRenderKit);
    });

    it('initializes document rendering context with `NamespaceAliaser`', () => {

      const drCtx = renderKit.contextOf(doc.createElement('div'));
      const ns = new NamespaceDef('uri:test:ns');

      drCtx.nsAlias(ns);
      expect(nsAlias).toHaveBeenCalledWith(ns);
    });
    it('initializes document rendering context with `DefaultRenderScheduler`', () => {

      const drCtx = renderKit.contextOf(doc.createElement('div'));

      drCtx.scheduler();
      expect(scheduler).toHaveBeenCalledTimes(1);
    });
    it('initializes document rendering context only once', () => {
      renderKit.contextOf(doc.createElement('div'));

      const newNsAlias = jest.fn(newNamespaceAliaser());

      drekContextOf(doc).update({ nsAlias: newNsAlias });

      const drCtx = renderKit.contextOf(doc);
      const ns = new NamespaceDef('uri:test:ns');

      drCtx.nsAlias(ns);
      expect(newNsAlias).toHaveBeenCalledWith(ns);
      expect(nsAlias).not.toHaveBeenCalled();
    });

    describe('toString', () => {
      it('returns string representation', () => {
        expect(String(DocumentRenderKit)).toBe('[DocumentRenderKit]');
      });
    });
  });
});
