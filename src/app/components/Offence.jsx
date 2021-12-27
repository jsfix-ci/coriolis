import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import PieChart from './PieChart';
import { MountFixed, MountGimballed, MountTurret } from './SvgIcons';
import { Ship } from 'ed-forge';
import autoBind from 'auto-bind';
import { DAMAGE_METRICS } from 'ed-forge/lib/src/ship-stats';
import { clone, mapValues, mergeWith, reverse, sortBy, sum, toPairs, values } from 'lodash';

/**
 * Turns an object into a tooltip.
 * @param {function} translate Translate function
 * @param {object} o Map to make the tooltip from
 * @returns {React.Component} Tooltip
 */
function objToTooltip(translate, o) {
  return toPairs(o)
    .filter(([k, v]) => Boolean(v))
    .map(([k, v]) => <div key={k}>{`${translate(k)}: ${v}`}</div>);
}

/**
 * Returns a data object used by {@link PieChart} that shows damage by type.
 * @param {function} translate  Translation function
 * @param {Calc.SDps} o         Object that holds sdps split up by type
 * @returns {Object}            Data object
 */
function objToPie(translate, o) {
  return toPairs(o).map(([k, value]) => {
    return { label: translate(k), value };
  });
}

/**
 * Offence information
 * Offence information consists of four panels:
 *   - textual information (time to drain cap, time to take down shields etc.)
 *   - breakdown of damage sources (pie chart)
 *   - comparison of shield resistances (table chart)
 *   - effective sustained DPS of weapons (bar chart)
 */
export default class Offence extends TranslatedComponent {
  static propTypes = {
    code: PropTypes.string.isRequired,
    ship: PropTypes.instanceOf(Ship).isRequired,
    opponent: PropTypes.instanceOf(Ship).isRequired,
    engagementRange: PropTypes.number.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    autoBind(this);

    this.state = {
      predicate: 'classRating',
      desc: true,
    };
  }

  /**
   * Set the sort order and sort
   * @param  {string} predicate Sort predicate
   */
  _sortOrder(predicate) {
    let desc = predicate == this.state.predicate ? !this.state.desc : true;
    this.setState({ predicate, desc });
  }

  /**
   * Render offence
   * @return {React.Component} contents
   */
  render() {
    const { ship } = this.props;
    const { language, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const sortOrder = this._sortOrder;

    const {
      drained, sustained, rangeMultiplier, hardnessMultiplier, timeToDrain
    } = ship.getMetrics(DAMAGE_METRICS);
    const portions = {
      Absolute: sustained.types.abs,
      Explosive: sustained.types.expl,
      Kinetic: sustained.types.kin,
      Thermic: sustained.types.therm,
    };

    const oppShield = ship.getOpponent().getShield();
    const shieldMults = {
      Absolute: 1,
      Explosive: oppShield.explosive.damageMultiplier,
      Kinetic: oppShield.kinetic.damageMultiplier,
      Thermic: oppShield.thermal.damageMultiplier,
    };

    const oppArmour = ship.getOpponent().getArmour();
    const armourMults = {
      Absolute: 1,
      Explosive: oppArmour.explosive.damageMultiplier,
      Kinetic: oppArmour.kinetic.damageMultiplier,
      Thermic: oppArmour.thermal.damageMultiplier,
    };

    const weapons = sortBy(ship.getHardpoints(), (m) => m.get('distributordraw'));
    let rows = weapons.map((weapon) => {
      const sdps = weapon.get('sustaineddamagepersecond');
      const byRange = weapon.getRangeEffectiveness();
      const weaponPortions = {
        Absolute: weapon.get('absolutedamageportion'),
        Explosive: weapon.get('explosivedamageportion'),
        Kinetic: weapon.get('kineticdamageportion'),
        Thermic: weapon.get('thermicdamageportion'),
      };
      const baseSdpsTooltip = objToTooltip(
        translate,
        mapValues(weaponPortions, (p) => formats.f1(sdps * p)),
      );

      const bySys = oppShield.absolute.bySys;
      const shieldResEfts = mergeWith(
        clone(weaponPortions),
        shieldMults,
        (objV, srcV) => objV * srcV
      );
      const byShieldRes = sum(values(shieldResEfts));
      const shieldsSdpsTooltip = objToTooltip(
        translate,
        mapValues(
          shieldResEfts,
          (mult) => formats.f1(byRange * mult * bySys * sdps),
        ),
      );
      const shieldsEftTooltip = objToTooltip(
        translate,
        {
          range: formats.pct1(byRange),
          resistance: formats.pct1(byShieldRes),
          'power distributor': formats.pct1(bySys),
        },
      );
      const shieldEft = byRange * byShieldRes * bySys;

      const byHardness = weapon.getArmourEffectiveness();
      const armourResEfts = mergeWith(
        clone(weaponPortions),
        armourMults,
        (objV, srcV) => objV * srcV,
      );
      const byArmourRes = sum(values(armourResEfts));
      const armourSdpsTooltip = objToTooltip(
        translate,
        mapValues(
          armourResEfts,
          (mult) => formats.f1(byRange * mult * byHardness * sdps)
        ),
      );
      const armourEftTooltip = objToTooltip(
        translate,
        {
          range: formats.pct1(byRange),
          resistance: formats.pct1(byArmourRes),
          hardness: formats.pct1(byHardness),
        },
      );
      const armourEft = byRange * byArmourRes * byHardness;

      const bp = weapon.getBlueprint();
      const grade = weapon.getBlueprintGrade();
      const exp = weapon.getExperimental();
      let bpTitle = `${translate(bp)} ${translate('grade')} ${grade}`;
      if (exp) {
        bpTitle += `, ${translate(exp)}`;
      }
      return {
        slot: weapon.getSlot(),
        mount: weapon.mount,
        classRating: weapon.getClassRating(),
        type: weapon.readMeta('type'),
        bpTitle: bp ? ` (${bpTitle})` : null,
        sdps,
        baseSdpsTooltip,
        shieldSdps: sdps * shieldEft,
        shieldEft,
        shieldsSdpsTooltip,
        shieldsEftTooltip,
        armourSdps: sdps * armourEft,
        armourEft,
        armourSdpsTooltip,
        armourEftTooltip,
      };
    });

    const { predicate, desc } = this.state;
    rows = sortBy(rows, (row) => row[predicate]);
    if (desc) {
      reverse(rows);
    }

    const sdpsTooltip = objToTooltip(
      translate,
      mapValues(portions, (p) => formats.f1(sustained.dps * p)),
    );
    const sdpsPie = objToPie(
      translate,
      mapValues(portions, (p) => Math.round(sustained.dps * p)),
    );

    const shieldSdpsSrcs = mergeWith(
      clone(portions),
      shieldMults,
      (objV, srcV) => sustained.dps * oppShield.absolute.bySys *
        rangeMultiplier * objV * srcV,
    );
    const shieldsSdps = sum(values(shieldSdpsSrcs));
    const shieldsSdpsTooltip = objToTooltip(
      translate,
      mapValues(shieldSdpsSrcs, (v) => formats.f1(v)),
    );
    const shieldsSdpsPie = objToPie(
      translate,
      mapValues(shieldSdpsSrcs, (v) => Math.round(v)),
    );

    const armourSdpsSrcs = mergeWith(
      clone(portions),
      armourMults,
      (objV, srcV) => sustained.dps * hardnessMultiplier * rangeMultiplier *
        objV * srcV,
    );
    const armourSdps = sum(values(armourSdpsSrcs));
    const totalArmourSDpsTooltipDetails = objToTooltip(
      translate,
      mapValues(armourSdpsSrcs, (v) => formats.f1(v)),
    );
    const armourSDpsData = objToPie(
      translate,
      mapValues(armourSdpsSrcs, (v) => Math.round(v)),
    );

    const drainedPortions = {
      Absolute: drained.types.abs,
      Explosive: drained.types.expl,
      Kinetic: drained.types.kin,
      Thermic: drained.types.therm,
    };

    // How much damage do we deal, before the capacitor is empty?
    const armourLeft = oppArmour.armour - (timeToDrain * armourSdps);
    // If we can't kill the enemy on one capacitor, factor in drained damage
    let timeToDepleteArmour;
    if (armourLeft > 0) {
      const effectiveDrainedDps = sum(values(mergeWith(
        clone(drainedPortions),
        armourMults,
        (objV, srcV) => objV * srcV,
      ))) * drained.dps * rangeMultiplier *
        hardnessMultiplier;
      timeToDepleteArmour = effectiveDrainedDps === 0 ? Infinity :
        timeToDrain + (armourLeft / effectiveDrainedDps);
    } else {
      timeToDepleteArmour = oppArmour.armour / armourSdps;
    }

    // How much damage do we deal, before the capacitor is empty?
    const shieldsLeft = oppShield.withSCBs - (timeToDrain * shieldsSdps);
    // If we can't kill the enemy on one capacitor, factor in drained damage
    let timeToDepleteShields;
    if (shieldsLeft > 0) {
      const effectiveDrainedDps = sum(values(mergeWith(
        clone(drainedPortions),
        shieldMults,
        (objV, srcV) => objV * srcV,
      ))) * drained.dps * rangeMultiplier;
      timeToDepleteShields = effectiveDrainedDps === 0 ? Infinity :
        timeToDrain + (shieldsLeft / effectiveDrainedDps);
    } else {
      timeToDepleteShields = oppShield.withSCBs / shieldsSdps;
    }

    return (
      <span id='offence'>
        <div className='group full'>
          <table>
            <thead>
              <tr className='main'>
                <th rowSpan='2' className='sortable' onClick={sortOrder.bind(this, 'classRating')}>{translate('weapon')}</th>
                <th colSpan='1'>{translate('overall')}</th>
                <th colSpan='2'>{translate('opponent\'s shields')}</th>
                <th colSpan='2'>{translate('opponent\'s armour')}</th>
              </tr>
              <tr>
                <th className='lft sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVE_SDPS_SHIELDS')}
                  onMouseOut={tooltip.bind(null, null)} onClick={sortOrder.bind(this, 'sdps')}>sdps</th>
                <th className='lft sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVE_SDPS_SHIELDS')}
                  onMouseOut={tooltip.bind(null, null)} onClick={sortOrder.bind(this, 'shieldSdps')}>sdps</th>
                <th className='sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVENESS_SHIELDS')}
                  onMouseOut={tooltip.bind(null, null)}onClick={sortOrder.bind(this, 'shieldEft')}>eft</th>
                <th className='lft sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVE_SDPS_ARMOUR')}
                  onMouseOut={tooltip.bind(null, null)}onClick={sortOrder.bind(this, 'armourSdps')}>sdps</th>
                <th className='sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVENESS_ARMOUR')}
                  onMouseOut={tooltip.bind(null, null)} onClick={sortOrder.bind(this, 'armourEft')}>eft</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slot}>
                  <td className='ri'>
                    {row.mount == 'F' ? <span onMouseOver={termtip.bind(null, 'fixed')} onMouseOut={tooltip.bind(null, null)}><MountFixed className='icon'/></span> : null}
                    {row.mount == 'G' ? <span onMouseOver={termtip.bind(null, 'gimballed')} onMouseOut={tooltip.bind(null, null)}><MountGimballed /></span> : null}
                    {row.mount == 'T' ? <span onMouseOver={termtip.bind(null, 'turreted')} onMouseOut={tooltip.bind(null, null)}><MountTurret /></span> : null}
                    {row.classRating} {translate(row.type)}
                    {row.bpTitle}
                  </td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, row.baseSdpsTooltip)}
                      onMouseOut={tooltip.bind(null, null)}
                    >{formats.f1(row.sdps)}</span></td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, row.shieldsSdpsTooltip)}
                      onMouseOut={tooltip.bind(null, null)}
                    >{formats.f1(row.shieldSdps)}</span></td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, row.shieldsEftTooltip)}
                      onMouseOut={tooltip.bind(null, null)}
                    >{formats.pct1(row.shieldEft)}</span></td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, row.armourSdpsTooltip)}
                      onMouseOut={tooltip.bind(null, null)}
                    >{formats.f1(row.armourSdps)}</span></td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, row.armourEftTooltip)}
                      onMouseOut={tooltip.bind(null, null)}
                    >{formats.pct1(row.armourEft)}</span></td>
                </tr>
              ))}
              {rows.length > 0 &&
                <tr>
                  <td></td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, sdpsTooltip)} onMouseOut={tooltip.bind(null, null)}>
                      ={formats.f1(sustained.dps)}
                    </span>
                  </td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, shieldsSdpsTooltip)} onMouseOut={tooltip.bind(null, null)}>
                      ={formats.f1(shieldsSdps)}
                    </span>
                  </td>
                  <td></td>
                  <td className='ri'>
                    <span onMouseOver={termtip.bind(null, totalArmourSDpsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>
                      ={formats.f1(armourSdps)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div className='group quarter'>
          <h2>{translate('offence metrics')}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_DRAIN_WEP'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('PHRASE_TIME_TO_DRAIN_WEP')}<br/>
            {timeToDrain === Infinity ? translate('never') : formats.time(timeToDrain)}
          </h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_EFFECTIVE_SDPS_SHIELDS'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('PHRASE_EFFECTIVE_SDPS_SHIELDS')}<br/>
            {formats.f1(shieldsSdps)}
          </h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_REMOVE_SHIELDS'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('PHRASE_TIME_TO_REMOVE_SHIELDS')}<br/>
            {timeToDepleteShields === Infinity ? translate('never') : formats.time(timeToDepleteShields)}
          </h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_EFFECTIVE_SDPS_ARMOUR'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('PHRASE_EFFECTIVE_SDPS_ARMOUR')}<br/>
            {formats.f1(armourSdps)}
          </h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_REMOVE_ARMOUR'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('PHRASE_TIME_TO_REMOVE_ARMOUR')}<br/>
            {timeToDepleteArmour === Infinity ? translate('never') : formats.time(timeToDepleteArmour)}
          </h2>
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_OVERALL_DAMAGE'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('overall damage')}
          </h2>
          <PieChart data={sdpsPie} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SHIELD_DAMAGE'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('shield damage sources')}
          </h2>
          <PieChart data={shieldsSdpsPie} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_ARMOUR_DAMAGE'))}
            onMouseOut={tooltip.bind(null, null)}>
            {translate('armour damage sources')}
          </h2>
          <PieChart data={armourSDpsData} />
        </div>
      </span>);
  }
}
