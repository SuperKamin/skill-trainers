// Trivia packs. Built ones carry their questions; the rest show as "coming" on the Mix screen.
// To add a pack: write trainers/packs/trivia-<id>.js (same shape as trivia-minecraft.js), import it here.
import minecraft from './trivia-minecraft.js';
import mcTech from './trivia-mc-tech.js';
import geography from './trivia-geography.js';
import science from './trivia-science.js';
import general from './trivia-general.js';

export const PACKS = [
  general,
  geography,
  science,
  minecraft,
  mcTech,
];

export const packById = id => PACKS.find(p => p.id === id && !p.coming);
