export function buildProfileContext(profile) {
  const parts = [];
  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.genderIdentity) parts.push(`Gender: ${profile.genderIdentity}`);
  if (profile.ageRange) parts.push(`Age range: ${profile.ageRange}`);
  if (profile.employment) parts.push(`Employment: ${profile.employment}`);
  if (profile.city) parts.push(`City: ${profile.city}`);
  if (profile.mood) parts.push(`Current mood/energy: ${profile.mood}/10`);
  if (profile.relationshipStatus) parts.push(`Relationship: ${profile.relationshipStatus}`);
  if (profile.fitnessLevel) parts.push(`Fitness: ${profile.fitnessLevel}`);
  return parts.join(' | ');
}

export function getProfileSummary(profile) {
  const age = profile.ageRange || 'unknown age';
  const gender = profile.genderIdentity || 'person';
  const employment = profile.employment || 'employment unknown';
  const city = profile.city || 'their city';
  return `${age} ${gender}, ${employment}, in ${city}`;
}

export function defaultProfile() {
  return {
    name: '',
    genderIdentity: '',
    ageRange: '',
    employment: '',
    mood: 5,
    energy: 5,
    city: 'New York',
    relationshipStatus: '',
    fitnessLevel: '',
  };
}
