import { ModuleGroupToName, MountMap, BulkheadNames } from './Constants';
import * as Utils from '../utils/UtilityFunctions';
import LZString from 'lz-string';
import { outfitURL } from '../utils/UrlGenerators';

/**
 * Generates ship-loadout JSON Schema standard object
 * @param  {Object} standard model
 * @return {Object} JSON Schema
 */
function standardToSchema(standard) {
  if (standard.m) {
    let o = {
      class: standard.m.class,
      rating: standard.m.rating,
      enabled: Boolean(standard.enabled),
      priority: standard.priority + 1
    };

    if (standard.m.name) {
      o.name = standard.m.name;
    }

    if (standard.m.mods && Object.keys(standard.m.mods).length > 0) {
      o.modifications = standard.m.mods;
    }

    if (standard.m.blueprint && Object.keys(standard.m.blueprint).length > 0) {
      o.blueprint = standard.m.blueprint;
    }

    return o;
  }
  return null;
}

/**
 * Generates ship-loadout JSON Schema slot object
 * @param  {Object} slot Slot model
 * @return {Object}      JSON Schema Slot
 */
function slotToSchema(slot) {
  if (slot.m) {
    let o = {
      class: slot.m.class,
      rating: slot.m.rating,
      enabled: Boolean(slot.enabled),
      priority: slot.priority + 1,
      group: ModuleGroupToName[slot.m.grp]
    };

    if (slot.m.name) {
      o.name = slot.m.name;
    }
    if (slot.m.mount) {
      o.mount = MountMap[slot.m.mount];
    }
    if (slot.m.missile) {
      o.missile = slot.m.missile;
    }
    if (slot.m.mods && Object.keys(slot.m.mods).length > 0) {
      o.modifications = slot.m.mods;
    }
    if (slot.m.blueprint && Object.keys(slot.m.blueprint).length > 0) {
      o.blueprint = slot.m.blueprint;
    }

    return o;
  }
  return null;
}

/**
 * Serializes a comparion and all of the ships to zipped
 * Base 64 encoded JSON.
 * @param  {string} name        Comparison name
 * @param  {array} builds       Array of ship builds
 * @param  {array} facets       Selected facets
 * @param  {string} predicate   sort predicate
 * @param  {boolean} desc       sort order
 * @return {string}             Zipped Base 64 encoded JSON
 */
export function fromComparison(name, builds, facets, predicate, desc) {
  return LZString.compressToBase64(JSON.stringify({
    n: name,
    b: builds.map((b) => { return { s: b.id, n: b.buildName, c: b.toString() }; }),
    f: facets,
    p: predicate,
    d: desc ? 1 : 0
  }));
};

/**
 * Parses the comarison data string back to an object.
 * @param  {string} code Zipped Base 64 encoded JSON comparison data
 * @return {Object} Comparison data object
 */
export function toComparison(code) {
  return JSON.parse(LZString.decompressFromBase64(Utils.fromUrlSafe(code)));
};
