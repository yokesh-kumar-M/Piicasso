import { coarseLocation, coarsenCoordinate } from './locationPrivacy';

describe('coarse location privacy', () => {
  it('rounds coordinates to roughly an 11 km grid', () => {
    expect(coarsenCoordinate(12.9715987)).toBe(13);
    expect(coarsenCoordinate(77.594566)).toBe(77.6);
  });

  it('does not attach a city inferred by an external service', () => {
    expect(coarseLocation({ latitude: 12.9715987, longitude: 77.594566 })).toEqual({
      latitude: 13,
      longitude: 77.6,
      city: 'Approximate area',
      country_code: 'UNK',
    });
  });

  it('rejects invalid coordinates', () => {
    expect(() => coarsenCoordinate('unknown')).toThrow(TypeError);
  });
});
