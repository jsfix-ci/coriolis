import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import LineChart from '../components/LineChart';
import { calculateJumpRange } from 'ed-forge/lib/src/stats/JumpRangeProfile';
import { ShipProps } from 'ed-forge';
const { LADEN_MASS } = ShipProps;

/**
 * FSD profile for a given ship
 */
export default class FSDProfile extends TranslatedComponent {
  static propTypes = {
    code: PropTypes.string.isRequired,
    ship: PropTypes.object.isRequired,
    cargo: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
  };

  /**
   * Render FSD profile
   * @return {React.Component} contents
   */
  render() {
    const { language } = this.context;
    const { translate } = language;
    const { code, ship } = this.props;

    const minMass = ship.readProp('hullmass');
    const maxMass = ship.getThrusters().get('enginemaximalmass');
    const mass = ship.get(LADEN_MASS);
    const cb = (mass) => calculateJumpRange(ship, mass, Infinity, true);
    return (
      <LineChart
        xMin={minMass}
        xMax={maxMass}
        yMin={0}
        yMax={cb(minMass)}
        // Add a mark at our current mass
        xMark={Math.min(mass, maxMass)}
        xLabel={translate('mass')}
        xUnit={translate('T')}
        yLabel={translate('maximum range')}
        yUnit={translate('LY')}
        func={cb}
        points={200}
        code={code}
        aspect={0.7}
      />
    );
  }
}
