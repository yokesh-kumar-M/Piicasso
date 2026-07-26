/** Submit a validated structured PII profile for AI-backed generation. */
'use strict';

const api = require('../api/client');
const { ok, dim, label, out } = require('../ui/theme');

const PATTERN_MODES = new Set(['standard', 'corporate', 'leetspeak', 'deep']);
const SUPPORTED_FIELDS = new Set([
  'full_name', 'birth_year', 'phone_suffix', 'gov_id', 'passport_id',
  'mother_maiden', 'blood_type', 'height', 'username', 'email', 'pet_names',
  'spouse_name', 'childhood_nickname', 'social_handles', 'relationship_status',
  'close_contacts', 'group_affiliations', 'child_names', 'father_name',
  'sibling_names', 'best_friend', 'hometown', 'school_name', 'last_location',
  'travel_history', 'live_coordinates', 'frequent_places', 'current_city',
  'street_name', 'zip_code', 'state', 'country', 'vacation_spot',
  'favourite_movies', 'sports_team', 'first_car_model', 'shopping_sites',
  'habit_patterns', 'search_keywords', 'content_timing', 'favourite_food',
  'musician', 'hobbies', 'books', 'games', 'employer_name',
  'social_media_handle', 'job_title', 'department', 'employee_id', 'boss_name',
  'past_company', 'university', 'degree', 'bank_suffix', 'crypto_wallet',
  'vehicle_reg', 'property_id', 'plate_number_partial', 'bank_name',
  'brand_affinity', 'device_type', 'subscription',
]);

function parseProfile(pairs) {
  const profile = {};
  for (const raw of Array.isArray(pairs) ? pairs : []) {
    const separator = raw.indexOf('=');
    if (separator <= 0) throw new Error(`invalid --profile value ${JSON.stringify(raw)}; expected key=value`);
    const key = raw.slice(0, separator).trim();
    const value = raw.slice(separator + 1).trim();
    if (!SUPPORTED_FIELDS.has(key)) throw new Error(`unsupported PII field: ${key}`);
    profile[key] = value;
  }
  if (!Object.values(profile).some(Boolean)) {
    throw new Error('at least one non-empty --profile key=value pair is required');
  }
  return profile;
}

async function run({ profile = [], patternMode = 'standard', json = false } = {}) {
  const normalizedMode = String(patternMode).toLowerCase();
  if (!PATTERN_MODES.has(normalizedMode)) {
    throw new Error(`unsupported pattern mode: ${patternMode}`);
  }
  const payload = { ...parseProfile(profile), pattern_mode: normalizedMode };
  const data = await api.call({ method: 'POST', url: 'submit/', data: payload });

  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return data;
  }
  console.log(ok('submitted.'));
  if (data && data.id !== undefined) console.log(label('id     ') + ' ' + out(String(data.id)));
  if (data && data.status) console.log(label('status ') + ' ' + out(String(data.status)));
  if (data && Array.isArray(data.wordlist)) console.log(dim(`words: ${data.wordlist.length}`));
  return data;
}

module.exports = { run, parseProfile, SUPPORTED_FIELDS, PATTERN_MODES };
