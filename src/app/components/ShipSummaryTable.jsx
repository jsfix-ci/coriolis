import autoBind from 'auto-bind';
import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import { Warning } from './SvgIcons';

import { ShipProps } from 'ed-forge';
const {
  SPEED, BOOST_SPEED, DAMAGE_METRICS, JUMP_METRICS, SHIELD_METRICS,
  ARMOUR_METRICS, CARGO_CAPACITY, FUEL_CAPACITY, UNLADEN_MASS, MAXIMUM_MASS,
  MODULE_PROTECTION_METRICS, PASSENGER_CAPACITY
} = ShipProps;

/**
 * Ship Summary Table / Stats
 */
export default class ShipSummaryTable extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    code: PropTypes.string.isRequired,
  };

  /**
   * The ShipSummaryTable constructor
   * @param {Object} props The props
   */
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      shieldColour: 'blue'
    };
  }

  /**
   * Render the table
   * @return {React.Component} Summary table
   */
  render() {
    const { ship } = this.props;
    let { language, tooltip, termtip } = this.context;
    let translate = language.translate;
    let u = language.units;
    let formats = language.formats;
    let { time, int, f1, f2 } = formats;
    let hide = tooltip.bind(null, null);

    const speed = ship.get(SPEED);
    const shipBoost = ship.get(BOOST_SPEED);
    const canThrust = 0 < speed;
    const canBoost = canThrust && !isNaN(shipBoost);
    const speedTooltip = canThrust ? 'TT_SUMMARY_SPEED' : 'TT_SUMMARY_SPEED_NONFUNCTIONAL';
    const boostTooltip = canBoost ? 'TT_SUMMARY_BOOST' : canThrust ? 'TT_SUMMARY_BOOST_NONFUNCTIONAL' : 'TT_SUMMARY_SPEED_NONFUNCTIONAL';

    const sgMetrics = ship.get(SHIELD_METRICS);
    const armourMetrics = ship.get(ARMOUR_METRICS);
    const damageMetrics = ship.get(DAMAGE_METRICS);
    const moduleProtectionMetrics = ship.get(MODULE_PROTECTION_METRICS);
    const timeToDrain = damageMetrics.timeToDrain[8];

    const shieldGenerator = ship.getShieldGenerator();
    const sgClassNames = cn({
      warning: shieldGenerator && !shieldGenerator.isEnabled(),
      muted: !shieldGenerator,
    });
    const sgTooltip = shieldGenerator ? 'TT_SUMMARY_SHIELDS' : 'TT_SUMMARY_SHIELDS_NONFUNCTIONAL';
    const sgType = shieldGenerator ? shieldGenerator.readMeta('type') : undefined;
    let shieldColour = 'blue';
    switch (sgType) {
      case 'biweaveshieldgen': shieldColour = 'purple'; break;
      case 'prismaticshieldgen': shieldColour = 'green'; break;
    }
    this.state = { shieldColour };

    const jumpRangeMetrics = ship.getMetrics(JUMP_METRICS);
    // TODO:
    const canJump = true;

    return <div id='summary'>
      <div style={{ display: 'table', width: '100%' }}>
        <div style={{ display: 'table-row' }}>
          <table className={'summaryTable'}>
            <thead>
              <tr className='main'>
                <th rowSpan={2} className={ cn({ 'bg-warning-disabled': speed == 0 }) }>{translate('speed')}</th>
                <th rowSpan={2} className={ cn({ 'bg-warning-disabled': !canBoost }) }>{translate('boost')}</th>
                <th colSpan={5} className={ cn({ 'bg-warning-disabled': jumpRangeMetrics.jumpRange == 0 }) }>{translate('jump range')}</th>
                <th rowSpan={2}>{translate('shield')}</th>
                <th rowSpan={2}>{translate('integrity')}</th>
                <th rowSpan={2}>{translate('DPS')}</th>
                <th rowSpan={2}>{translate('EPS')}</th>
                <th rowSpan={2}>{translate('TTD')}</th>
                {/* <th onMouseEnter={termtip.bind(null, 'heat per second')} onMouseLeave={hide} rowSpan={2}>{translate('HPS')}</th> */}
                <th rowSpan={2}>{translate('cargo')}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'passenger capacity', { cap: 0 })} onMouseLeave={hide}>{translate('pax')}</th>
                <th rowSpan={2}>{translate('fuel')}</th>
                <th colSpan={3}>{translate('mass')}</th>
                <th onMouseEnter={termtip.bind(null, 'hull hardness', { cap: 0 })} onMouseLeave={hide} rowSpan={2}>{translate('hrd')}</th>
                <th rowSpan={2}>{translate('crew')}</th>
                <th onMouseEnter={termtip.bind(null, 'mass lock factor', { cap: 0 })} onMouseLeave={hide} rowSpan={2}>{translate('MLF')}</th>
                <th onMouseEnter={termtip.bind(null, 'TT_SUMMARY_BOOST_INTERVAL', { cap: 0 })} onMouseLeave={hide} rowSpan={2}>{translate('boost interval')}</th>
                <th rowSpan={2}>{translate('resting heat (Beta)')}</th>
              </tr>
              <tr>
                <th className="lft">{translate('max')}</th>
                <th>{translate('unladen')}</th>
                <th>{translate('laden')}</th>
                <th>{translate('total unladen')}</th>
                <th>{translate('total laden')}</th>
                <th className='lft'>{translate('hull')}</th>
                <th>{translate('unladen')}</th>
                <th>{translate('laden')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td onMouseEnter={termtip.bind(null, speedTooltip, { cap: 0 })}
                  onMouseLeave={hide}
                >{canThrust ?
                    <span>{int(speed)}{u['m/s']}</span> :
                    <span className='warning'>0<Warning/></span>
                  }</td>
                <td onMouseEnter={termtip.bind(null, boostTooltip, { cap: 0 })}
                  onMouseLeave={hide}
                >{canBoost ?
                    <span>{int(shipBoost)}{u['m/s']}</span> :
                    <span className='warning'>0<Warning/></span>
                  }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_MAX_SINGLE_JUMP', { cap: 0 })}
                  onMouseLeave={hide}
                >{canJump ?
                  // TODO:
                    <span>{NaN}{u.LY}</span> :
                    <span className='warning'>0<Warning/></span>
                  }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_SINGLE_JUMP', { cap: 0 })}
                  onMouseLeave={hide}
                >{canJump ?
                  // TODO:
                    <span>{NaN}{u.LY}</span> :
                    <span className='warning'>0<Warning/></span>
                  }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_SINGLE_JUMP', { cap: 0 })}
                  onMouseLeave={hide}
                >{canJump ?
                    <span>{f2(jumpRangeMetrics.jumpRange)}{u.LY}</span> :
                    <span className='warning'>0<Warning/></span>
                  }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_TOTAL_JUMP', { cap: 0 })}
                  onMouseLeave={hide}
                >{canJump ?
                  // TODO:
                    <span>{NaN}{u.LY}</span> :
                    <span className='warning'>0 <Warning/></span>
                  }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_TOTAL_JUMP', { cap: 0 })}
                  onMouseLeave={hide}
                >{canJump ?
                    <span>{f2(jumpRangeMetrics.totalRange)}{u.LY}</span> :
                    <span className='warning'>0<Warning/></span>
                  }</td>
                <td className={sgClassNames}
                  onMouseEnter={termtip.bind(null, sgTooltip, { cap: 0 })}
                  onMouseLeave={hide}
                >{int(sgMetrics.shieldStrength)}{u.MJ}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_INTEGRITY', { cap: 0 })}
                  onMouseLeave={hide}
                >{int(armourMetrics.armour)}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_DPS', { cap: 0 })}
                  onMouseLeave={hide}
                >{f1(damageMetrics.dps)}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_EPS', { cap: 0 })}
                  onMouseLeave={hide}
                >{f1(damageMetrics.eps)}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_TTD', { cap: 0 })}
                  onMouseLeave={hide}
                >{timeToDrain === Infinity ? '∞' : time(timeToDrain)}</td>
                {/* <td>{f1(ship.totalHps)}</td> */}
                <td>{ship.get(CARGO_CAPACITY)}{u.T}</td>
                <td>{ship.get(PASSENGER_CAPACITY)}</td>
                <td>{ship.get(FUEL_CAPACITY)}{u.T}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_HULL_MASS', { cap: 0 })}
                  onMouseLeave={hide}
                >{ship.readProp('hullmass')}{u.T}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_MASS', { cap: 0 })}
                  onMouseLeave={hide}
                >{int(ship.get(UNLADEN_MASS))}{u.T}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_MASS', { cap: 0 })}
                  onMouseLeave={hide}
                >{int(ship.get(MAXIMUM_MASS))}{u.T}</td>
                <td>{int(ship.readProp('hardness'))}</td>
                <td>{ship.readMeta('crew')}</td>
                <td>{ship.readProp('masslock')}</td>
                {/* TODO: boost intervall */}
                <td>{NaN}</td>
                {/* TODO: resting heat */}
                <td>{NaN}</td>
              </tr>
            </tbody>
          </table>
          <table className={'summaryTable'}>
            <thead className={this.state.shieldColour}>
              <tr>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'shield', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('shield')}</th>
                <th colSpan={4} className='lft'>{translate('resistance')}</th>

                <th colSpan={5} onMouseEnter={termtip.bind(null, 'TT_SUMMARY_SHIELDS_SCB', { cap: 0 })} onMouseLeave={hide} className='lft'>{`${translate('HP')}`}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECOVER', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('recovery')}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECHARGE', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('recharge')}</th>
              </tr>
              <tr>
                <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th></th>

                <th className={'bordered'}>{`${translate('absolute')}`}</th>
                <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{translate(sgType || 'No Shield')}</td>
                <td>{formats.pct1(1 - sgMetrics.explosive.damageMultiplier)}</td>
                <td>{formats.pct1(1 - sgMetrics.kinetic.damageMultiplier)}</td>
                <td>{formats.pct1(1 - sgMetrics.thermal.damageMultiplier)}</td>
                <td></td>

                <td>{int(sgMetrics.shieldStrength || 0)}{u.MJ}</td>
                <td>{int(sgMetrics.shieldStrength / sgMetrics.explosive.damageMultiplier || 0)}{u.MJ}</td>
                <td>{int(sgMetrics.shieldStrength / sgMetrics.kinetic.damageMultiplier || 0)}{u.MJ}</td>
                <td>{int(sgMetrics.shieldStrength / sgMetrics.thermal.damageMultiplier || 0)}{u.MJ}</td>
                <td></td>
                <td>{formats.time(sgMetrics.recover) || translate('Never')}</td>
                <td>{formats.time(sgMetrics.recharge) || translate('Never')}</td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'armour', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('armour')}</th>
                <th colSpan={4} className='lft'>{translate('resistance')}</th>

                <th colSpan={5} onMouseEnter={termtip.bind(null, 'PHRASE_EFFECTIVE_ARMOUR', { cap: 0 })} onMouseLeave={hide} className='lft'>{`${translate('HP')}`}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'TT_MODULE_ARMOUR', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('raw module armour')}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'TT_MODULE_PROTECTION_INTERNAL', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('internal protection')}</th>
              </tr>
              <tr>
                <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th>{`${translate('caustic')}`}</th>

                <th className={'bordered'}>{`${translate('absolute')}`}</th>
                <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th>{`${translate('caustic')}`}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{translate(ship.getAlloys().readMeta('type') || 'No Armour')}</td>
                <td>{formats.pct1(1 - armourMetrics.explosive.damageMultiplier)}</td>
                <td>{formats.pct1(1 - armourMetrics.kinetic.damageMultiplier)}</td>
                <td>{formats.pct1(1 - armourMetrics.thermal.damageMultiplier)}</td>
                <td>{formats.pct1(1 - armourMetrics.caustic.damageMultiplier)}</td>
                <td>{int(armourMetrics.armour)}</td>
                <td>{int(armourMetrics.armour / armourMetrics.explosive.damageMultiplier)}</td>
                <td>{int(armourMetrics.armour / armourMetrics.kinetic.damageMultiplier)}</td>
                <td>{int(armourMetrics.armour / armourMetrics.thermal.damageMultiplier)}</td>
                <td>{int(armourMetrics.armour / armourMetrics.caustic.damageMultiplier)}</td>
                <td>{int(moduleProtectionMetrics.moduleArmour)}</td>
                <td>{formats.pct1(1 - moduleProtectionMetrics.moduleProtection)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>;
  }
}
