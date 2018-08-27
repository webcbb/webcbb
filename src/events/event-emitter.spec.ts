import { EventEmitter } from './event-emitter';
import { EventInterest } from './event-producer';
import Spy = jasmine.Spy;

describe('events/event-emitter', () => {
  describe('EventEmitter', () => {

    let emitter: EventEmitter<(event: string) => string>;
    let consumerSpy: Spy;
    let consumer2Spy: Spy;

    beforeEach(() => {
      emitter = new EventEmitter();
    });
    beforeEach(() => {
      consumerSpy = jasmine.createSpy('consumer');
      consumer2Spy = jasmine.createSpy('consumer2');
    });

    describe('on', () => {

      let interest: EventInterest;

      beforeEach(() => {
        interest = emitter.on(consumerSpy);
      });

      it('registers event consumer', () => {
        emitter.on(consumer2Spy);

        emitter.notify('event');

        expect(consumerSpy).toHaveBeenCalledWith('event');
        expect(consumer2Spy).toHaveBeenCalledWith('event');
      });
      it('does not register event consumer', () => {
        expect(emitter.on(consumerSpy)).toBe(EventInterest.none);

        emitter.notify('event');

        expect(consumerSpy).toHaveBeenCalledWith('event');
        expect(consumerSpy).toHaveBeenCalledTimes(1);
      });
      it('unregisters consumer when its interest is lost', () => {
        emitter.on(consumer2Spy);
        interest.off();

        emitter.notify('event');

        expect(consumerSpy).not.toHaveBeenCalled();
        expect(consumer2Spy).toHaveBeenCalledWith('event');
      });
    });
    describe('reduce', () => {
      it('reduces value', () => {
        consumerSpy.and.returnValue('1');
        consumer2Spy.and.returnValue('2');
        emitter.on(consumerSpy);
        emitter.on(consumer2Spy);

        expect(emitter.reduce((prev, consumer) => prev + consumer(prev), '0')).toBe('012');
      });
    });
    describe('clear', () => {
      it('removes all event consumers', () => {
        emitter.on(consumerSpy);
        emitter.on(consumer2Spy);
        emitter.clear();

        emitter.notify('event');

        expect(consumerSpy).not.toHaveBeenCalled();
        expect(consumer2Spy).not.toHaveBeenCalled();
      });
    });
  });
});
