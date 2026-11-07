const COARSE_LOCATION_DECIMALS = 1;

export const coarsenCoordinate = (value) => {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) {
    throw new TypeError('Coordinate must be a finite number');
  }

  const factor = 10 ** COARSE_LOCATION_DECIMALS;
  return Math.round(coordinate * factor) / factor;
};

export const coarseLocation = ({ latitude, longitude }) => ({
  latitude: coarsenCoordinate(latitude),
  longitude: coarsenCoordinate(longitude),
  city: 'Approximate area',
  country_code: 'UNK',
});
