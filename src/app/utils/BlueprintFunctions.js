import React from 'react';
import { Modifications } from 'coriolis-data/dist';
import { Module } from 'ed-forge';
import { getBlueprintInfo } from 'ed-forge/lib/data/blueprints';
import { keys, uniq } from 'lodash';

/**
 * Generate a tooltip with details of a blueprint's specials
 * @param   {Object}  translate   The translate object
 * @param   {Object}  blueprint   The blueprint at the required grade
 * @param   {string}  grp         The group of the module
 * @param   {Object}  m           The module to compare with
 * @param   {string} specialName  The name of the special
 * @returns {Object}              The react components
 */
export function specialToolTip(translate, blueprint, grp, m, specialName) {
  const effects = [];
  if (!blueprint || !blueprint.features) {
    return undefined;
  }
  if (m) {
    // We also add in any benefits from specials that aren't covered above
    if (m.blueprint) {
      for (const feature in Modifications.modifierActions[specialName]) {
        // if (!blueprint.features[feature] && !m.mods.feature) {
        const featureDef = Modifications.modifications[feature];
        if (featureDef && !featureDef.hidden) {
          let symbol = '';
          if (feature === 'jitter') {
            symbol = '°';
          } else if (featureDef.type === 'percentage') {
            symbol = '%';
          }
          let current = m.getModValue(feature) - m.getModValue(feature, true);
          if (featureDef.type === 'percentage') {
            current = Math.round(current / 10) / 10;
          } else if (featureDef.type === 'numeric') {
            current /= 100;
          }
          const currentIsBeneficial = isValueBeneficial(feature, current);

          effects.push(
            <tr key={feature + '_specialTT'}>
              <td style={{ textAlign: 'left' }}>{translate(feature, grp)}</td>
              <td>&nbsp;</td>
              <td className={current === 0 ? '' : currentIsBeneficial ? 'secondary' : 'warning'}
                style={{ textAlign: 'right' }}>{current}{symbol}</td>
              <td>&nbsp;</td>
            </tr>
          );
        }
      }
    }
  }

  return (
    <div>
      <table width='100%'>
        <tbody>
          {effects}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Generate a tooltip with details and preview of a blueprint's effects
 * @param {Object} language The language object
 * @param {Module} m The module to compare with
 * @param {string} previewBP Blueprint to preview
 * @param {number} previewGrade Grade to preview
 * @returns {Object} The react components
 */
export function blueprintTooltip(language, m, previewBP, previewGrade) {
  const { translate, formats } = language;
  const blueprint = previewBP || m.getBlueprint();
  const grade = previewGrade || m.getBlueprintGrade();
  if (!blueprint) {
    return null;
  }

  const bpFeatures = getBlueprintInfo(blueprint).features[grade];
  const features = uniq(m.getModifiedProperties().concat(keys(bpFeatures)));

  return (
    <div>
      <table width='100%'>
        <thead>
          <tr>
            <td>{translate('feature')}</td>
            <td>{translate('worst')}</td>
            <td>{translate('current')}</td>
            <td>{translate('best')}</td>
          </tr>
        </thead>
        <tbody>
          {features.map((prop) => {
            const { value, unit, beneficial } = m.getModifierFormatted(prop);
            if (!bpFeatures[prop] && !value) {
              // Can happen for exported synthetics
              return null;
            }
            const { min, max } = bpFeatures[prop] || {};
            // If the product of value and min/max is positive, both values
            // point into the same direction, i.e. positive/negative.
            const minBeneficial  = (value * min) > 0 === beneficial;
            const maxBeneficial  = (value * max) > 0 === beneficial;
            return (<tr key={prop}>
              <td style={{ textAlign: 'left' }}>{translate(prop)}</td>
              <td className={!min ? '' : minBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>
                {!isNaN(min) && formats.round(min * 100)}{!isNaN(min) && unit}
              </td>
              <td className={!value ? '' : beneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>
                {formats.round(value || 0)}{unit}
              </td>
              <td className={!max ? '' : maxBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>
                {!isNaN(max) && formats.round(max * 100)}{!isNaN(max) && unit}
              </td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Get a blueprint with a given name and an optional module
 * @param   {string} name    The name of the blueprint
 * @param   {Object} module  The module for which to obtain this blueprint
 * @returns {Object}         The matching blueprint
 */
export function getBlueprint(name, module) {
  // Start with a copy of the blueprint
  const findMod = val => Object.keys(Modifications.blueprints).find(elem => elem.toString().toLowerCase().search(val.toString().toLowerCase().replace(/(OutfittingFieldType_|persecond)/igm, '')) >= 0);
  const found = Modifications.blueprints[findMod(name)];
  if (!found || !found.fdname) {
    return {};
  }
  const blueprint = JSON.parse(JSON.stringify(found));
  return blueprint;
}
