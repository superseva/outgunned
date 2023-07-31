/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/outgunned/templates/actor/parts/actor-feats.html",
    "systems/outgunned/templates/actor/parts/actor-weapons.html",
    "systems/outgunned/templates/actor/parts/actor-gear.html",
    "systems/outgunned/templates/actor/parts/actor-effects.html",
  ]);
};
