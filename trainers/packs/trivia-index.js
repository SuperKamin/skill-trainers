// Trivia packs. Built ones carry their questions; the rest show as "coming" on the Mix screen.
// To add a pack: write trainers/packs/trivia-<id>.js (same shape as trivia-minecraft.js), import it here.
import minecraft from './trivia-minecraft.js';

export const PACKS = [
  { id: 'general', title: { en: 'General knowledge', pt: 'Conhecimentos gerais' }, coming: true },
  { id: 'geography', title: { en: 'Geography', pt: 'Geografia' }, coming: true },
  { id: 'science', title: { en: 'Science', pt: 'Ciência' }, coming: true },
  minecraft,
];

export const packById = id => PACKS.find(p => p.id === id && !p.coming);
