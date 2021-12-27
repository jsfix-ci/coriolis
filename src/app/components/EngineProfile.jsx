import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import LineChart from '../components/LineChart';
import { getBoostMultiplier, getSpeedMultipliers } from 'ed-forge/lib/src/stats/SpeedProfile';
import { ShipProps } from 'ed-forge';
const { LADEN_MASS } = ShipProps;

/**
 * Engine profile for a given ship
 */
export default class EngineProfile extends TranslatedComponent {
  static propTypes = {
    code: PropTypes.string.isRequired,
    ship: PropTypes.object.isRequired,
    cargo: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
    pips: PropTypes.number.isRequired,
    boost: PropTypes.bool.isRequired,
  };

  /**
   * Render engine profile
   * @return {React.Component} contents
   */
  render() {
    const { language } = this.context;
    const { translate } = language;
    const { code, ship, pips, boost } = this.props;

    // Calculate bounds for our line chart
    const minMass = ship.readProp('hullmass');
    const maxMass = ship.getThrusters().get('enginemaximalmass');
    const baseSpeed = ship.readProp('speed');
    const baseBoost = getBoostMultiplier(ship);
    const cb = (eng, boost, mass) => {
      const mult = getSpeedMultipliers(ship, mass)[(boost ? 4 : eng) / 0.5];
      return baseSpeed * (boost ? baseBoost : 1) * mult;
    };
    // This graph can have a precipitous fall-off so we use lots of points to make it look a little smoother
    return (
      <LineChart
        xMin={minMass}
        xMax={maxMass}
        yMin={cb(0, false, maxMass)}
        yMax={cb(4, true, minMass)}
        // Add a mark at our current mass
        xMark={Math.min(ship.get(LADEN_MASS), maxMass)}
        xLabel={translate('mass')}
        xUnit={translate('T')}
        yLabel={translate('maximum speed')}
        yUnit={translate('m/s')}
        func={cb.bind(this, pips.Eng.base + pips.Eng.mc, boost)}
        points={1000}
        // Encode boost in code to re-render on state change
        code={`${pips.Eng.base + pips.Eng.mc}:${Number(boost)}:${code}`}
        aspect={0.7}
      />
    );
  }
}
