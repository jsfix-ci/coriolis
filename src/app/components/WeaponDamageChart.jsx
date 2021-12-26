import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import LineChart from '../components/LineChart';
import { moduleReduce } from 'ed-forge/lib/helper';
import { chain, keys, mapValues, values } from 'lodash';

const DAMAGE_DEALT_COLORS = ['#FFFFFF', '#FF0000', '#00FF00', '#7777FF', '#FFFF00', '#FF00FF', '#00FFFF', '#777777'];
const PORTION_MAPPINGS = {
  'absolute': 'absolutedamageportion',
  'explosive': 'explosivedamageportion',
  'kinetic': 'kineticdamageportion',
  'thermal': 'thermicdamageportion',
};
const MULTS = keys(PORTION_MAPPINGS);

// TODO: help with this in ed-forge
/**
 * .
 * @param {Object} opponentDefence .
 * @returns {Object} .
 */
function defenceToMults(opponentDefence) {
  return chain(opponentDefence)
    .pick(MULTS)
    .mapKeys((v, k) => PORTION_MAPPINGS[k])
    .mapValues((resistanceProfile) => resistanceProfile.damageMultiplier)
    .value();
}

/**
 * Weapon damage chart
 */
export default class WeaponDamageChart extends TranslatedComponent {
  static propTypes = {
    code: PropTypes.string.isRequired,
    ship: PropTypes.object.isRequired,
    opponentDefence: PropTypes.object.isRequired,
    engagementRange: PropTypes.number.isRequired,
  };

  /**
   * Render damage dealt
   * @return {React.Component} contents
   */
  render() {
    const { language } = this.context;
    const { translate } = language;
    const { code, ship, opponentDefence, engagementRange } = this.props;

    const hardpoints = ship.getHardpoints();
    const hardpointsMap = chain(hardpoints)
      .map((m) => [m.getSlot(), m])
      .fromPairs()
      .value();
    const mults = defenceToMults(opponentDefence);
    const cb = (range) => {
      return mapValues(
        hardpointsMap,
        (m) => {
          const sdps = m.get('sustaineddamagepersecond', true);
          const resistanceMul = chain(mults)
            .toPairs()
            .map((pair) => {
              const [k, mul] = pair;
              return m.get(k, true) * mul;
            })
            .sum()
            .value();

          const falloff = m.get('damagefalloffrange', true);
          const rangeMul = Math.min(1, Math.max(0,
            1 - (range - falloff) / (m.get('maximumrange', true) - falloff)
          ));
          return sdps * resistanceMul * rangeMul;
        }
      );
    };
    return (
      <div>
        <LineChart
          xMin={0}
          xMax={moduleReduce(
            hardpoints, 'maximumrange', true, (a, v) => Math.max(a, v), 1000,
          )}
          yMin={0}
          // Factor in highest damage multiplier to get a safe upper bound
          yMax={Math.max(1, ...values(mults)) * moduleReduce(
            hardpoints, 'sustaineddamagepersecond', true, (a, v) => Math.max(a, v), 0,
          )}
          xLabel={translate('range')}
          xUnit={translate('m')}
          yLabel={translate('sustaineddamagepersecond')}
          series={hardpoints.map((m) => m.getSlot())}
          xMark={engagementRange}
          colors={DAMAGE_DEALT_COLORS}
          func={cb}
          points={200}
          code={code}
        />
      </div>
    );
  }
}
