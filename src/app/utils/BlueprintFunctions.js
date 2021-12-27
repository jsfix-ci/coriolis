import React from 'react';
import { Module } from 'ed-forge';
import { getBlueprintInfo, getExperimentalInfo } from 'ed-forge/lib/src/data/blueprints';
import { fromPairs, keys, uniq } from 'lodash';

/**
 *
 * @param {Module} module Module to get modifiers for
 * @param {string[]} props Properties to get modifiers for
 * @returns {React.Component[]} Table-cell modifiers
 */
function _getModifiers(formats, module, props) {
  return fromPairs(props.map((prop) => {
    const { value, unit, beneficial } = module.getModifierFormatted(prop);
    return [
      prop,
      <td className={beneficial === undefined ? '' : beneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>
        {formats.round(value || 0)}{unit}
      </td>
    ];
  }));
}

/**
 * Generate a tooltip with details of a blueprint's specials
 * @param   {Object} language   The translate object
 * @param   {Module} m           The module to compare with
 * @param   {string} specialName  The name of the special
 * @returns {Object}              The react components
 */
export function specialToolTip(language, m, specialName) {
  const { formats, translate } = language;
  const features = keys(getExperimentalInfo(specialName).features);
  const currents = _getModifiers(formats, m, features);
  const thens = m.try(() => {
    m.setExperimental(specialName);
    return _getModifiers(formats, m, features);
  });
  return (
    <div>
      <table width='100%'>
      <thead>
          <tr>
            <td>{translate('feature')}</td>
            <td>{translate('current')}</td>
            <td>{translate('then')}</td>
          </tr>
        </thead>
        <tbody>
          {features.map((prop) => {
              return <tr key={prop + '_specialTT'}>
                <td style={{ textAlign: 'left' }}>{translate(prop)}</td>
                {currents[prop]}
                {thens[prop]}
              </tr>;
            }
          )}
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

  const features = uniq(m.getModifiedProperties().concat(
    keys(getBlueprintInfo(blueprint).features[grade])
  ));
  const mins = m.try(() => {
    m.setBlueprint(blueprint, grade, 0);
    return _getModifiers(formats, m, features);
  });
  const currents = _getModifiers(formats, m, features);
  const maxs = m.try(() => {
    m.setBlueprint(blueprint, grade, 1);
    return _getModifiers(formats, m, features);
  });

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
            return (<tr key={prop}>
              <td style={{ textAlign: 'left' }}>{translate(prop)}</td>
              {mins[prop]}
              {currents[prop]}
              {maxs[prop]}
            </tr>);
          })}
        </tbody>
      </table>
    </div>
  );
}
