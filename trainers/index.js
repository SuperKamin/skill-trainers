// The list of trainers shown on Home. To add one: create trainers/<id>.js
// exporting { id, name, blurb, mount(el, onResult, ctx) } and add it here.
import reaction from './reaction.js';

export const trainers = [reaction];

export const byId = id => trainers.find(t => t.id === id);
