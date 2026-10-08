// The list of trainers shown on Home. To add one: create trainers/<id>.js
// exporting { id, name, blurb, mount(el, onResult, ctx) } and add it here.
// Optional: modes: [{id, name, blurb}] (the first is the test mode), tip (a method he can
// carry into any practice), renderHistory(el, sessions, source) for a History of its own.
import reaction from './reaction.js';
import notes from './notes.js';
import { renderNotesHistory } from './notes-history.js';
import typing from './typing.js';
import { renderTypingHistory } from './typing-history.js';

notes.renderHistory = renderNotesHistory;
typing.renderHistory = renderTypingHistory;

export const trainers = [reaction, notes, typing];

export const byId = id => trainers.find(t => t.id === id);
