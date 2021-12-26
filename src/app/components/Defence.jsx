import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import PieChart from './PieChart';
import VerticalBarChart from './VerticalBarChart';
import autoBind from 'auto-bind';
import { ARMOUR_METRICS, MODULE_PROTECTION_METRICS, SHIELD_METRICS } from 'ed-forge/lib/ship-stats';

/**
 * Defence information
 * Shield information consists of four panels:
 *   - textual information (time to lose shields etc.)
 *   - breakdown of shield sources (pie chart)
 *   - comparison of shield resistances (bar chart)
 *   - effective shield (bar chart)
 */
export default class Defence extends TranslatedComponent {
  static propTypes = {
    code: PropTypes.string.isRequired,
    ship: PropTypes.object.isRequired,
    opponent: PropTypes.object.isRequired,
    engagementRange: PropTypes.number.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    autoBind(this);
  }

  /**
   * Render defence
   * @return {React.Component} contents
   */
  render() {
    const { ship } = this.props;
    const { language, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;

    const shields = ship.get(SHIELD_METRICS);

    // Data for pie chart (absolute MJ)
    const shieldSourcesData = [
      'byBoosters', 'byGenerator', 'byReinforcements', 'bySCBs',
    ].map((key) => { return { label: key, value: Math.round(shields[key]) }; });

    // Data for tooltip
    const shieldSourcesTt = shieldSourcesData.map((o) => {
      let { label, value } = o;
      return <div key={label}>
        {translate(label)} {formats.int(value)}{units.MJ}
      </div>;
    });

    // Shield resistances
    const shieldDamageTakenData = [
      'absolute', 'explosive', 'kinetic', 'thermal',
    ].map((label) => {
      const dmgMult = shields[label];
      const tooltip = ['byBoosters', 'byGenerator', 'bySys'].map(
        (label) => <div key={label}>
          {translate(label)} {formats.pct1(dmgMult[label])}
        </div>
      );
      return { label, value: Math.round(100 * dmgMult.withSys), tooltip };
    });

    // Effective MJ
    const effectiveShieldData = [
      'absolute', 'explosive', 'kinetic', 'thermal'
    ].map((label) => {
      const dmgMult = shields[label];
      const raw = shields.withSCBs;
      const tooltip = ['byBoosters', 'byGenerator', 'bySys'].map(
        (label) => <div key={label}>
          {translate(label)} {formats.int(raw * dmgMult[label])}{units.MJ}
        </div>
      );
      return { label, value: Math.round(dmgMult.withSys * raw), tooltip };
    });
    const maxEffectiveShield = Math.max(...effectiveShieldData.map((o) => o.value));

    const armour = ship.get(ARMOUR_METRICS);
    const moduleProtection = ship.get(MODULE_PROTECTION_METRICS);

    // Data for pie chart (absolute HP)
    const armourSourcesData = ['base', 'byAlloys', 'byHRPs',].map(
      (key) => { return { label: key, value: Math.round(armour[key]) }; }
    );

    // Data for tooltip
    const armourSourcesTt = armourSourcesData.map((o) => {
      let { label, value } = o;
      return <div key={label}>{translate(label)} {formats.int(value)}</div>;
    });

    // Armour resistances
    const armourDamageTakenData = [
      'absolute', 'explosive', 'kinetic', 'thermal', 'caustic',
    ].map((label) => {
      const dmgMult = armour[label];
      const tooltip = ['byAlloys', 'byHRPs'].map(
        (label) => <div key={label}>
          {translate(label)} {formats.pct1(dmgMult[label])}
        </div>
      );
      return { label, value: Math.round(100 * dmgMult.damageMultiplier), tooltip };
    });

    // Effective HP
    const effectiveArmourData = [
      'absolute', 'explosive', 'kinetic', 'thermal'
    ].map((label) => {
      const dmgMult = armour[label];
      const raw = armour.armour;
      const tooltip = ['byBoosters', 'byGenerator', 'bySys'].map(
        (label) => <div key={label}>
          {translate(label)} {formats.int(raw * dmgMult[label])}
        </div>
      );
      return { label, value: Math.round(dmgMult.damageMultiplier * raw), tooltip };
    });

    return (
      <span id='defence'>
        {shields.withSCBs ? <span>
          <div className='group quarter'>
            <h2>{translate('shield metrics')}</h2>
            <br/>
            <h2 onMouseOver={termtip.bind(null, <div>{shieldSourcesTt}</div>)} onMouseOut={tooltip.bind(null, null)} className='summary'>{translate('raw shield strength')}<br/>{formats.int(shields.withSCBs)}{units.MJ}</h2>
            <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_LOSE_SHIELDS'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_LOSE_SHIELDS')}<br/>TODO</h2>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SG_RECOVER'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_RECOVER_SHIELDS')}<br/>{shields.recover ? formats.time(shields.recover) : translate('never')}</h2>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SG_RECHARGE'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_RECHARGE_SHIELDS')}<br/>{shields.recharge ? formats.time(shields.recharge) : translate('never')}</h2>
          </div>
          <div className='group quarter'>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SHIELD_SOURCES'))} onMouseOut={tooltip.bind(null, null)}>{translate('shield sources')}</h2>
            <PieChart data={shieldSourcesData} />
          </div>
          <div className='group quarter'>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_DAMAGE_TAKEN'))} onMouseOut={tooltip.bind(null, null)}>{translate('damage taken')}(%)</h2>
            <VerticalBarChart data={shieldDamageTakenData} yMax={140} />
          </div>
          <div className='group quarter'>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_EFFECTIVE_SHIELD'))} onMouseOut={tooltip.bind(null, null)}>{translate('effective shield')}(MJ)</h2>
            <VerticalBarChart data={effectiveShieldData} yMax={maxEffectiveShield}/>
          </div>
        </span> : null }

        <div className='group quarter'>
          <h2>{translate('armour metrics')}</h2>
          <h2 onMouseOver={termtip.bind(null, <div>{armourSourcesTt}</div>)} onMouseOut={tooltip.bind(null, null)} className='summary'>{translate('raw armour strength')}<br/>{formats.int(armour.armour)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_LOSE_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_LOSE_ARMOUR')}<br/>TODO</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_MODULE_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('raw module armour')}<br/>{formats.int(moduleProtection.moduleArmour)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_MODULE_PROTECTION_EXTERNAL'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_MODULE_PROTECTION_EXTERNAL')}<br/>{formats.pct1((1 - moduleProtection.moduleProtection) / 2)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_MODULE_PROTECTION_INTERNAL'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_MODULE_PROTECTION_INTERNAL')}<br/>{formats.pct1(1 - moduleProtection.moduleProtection)}</h2>
          <br/>
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_ARMOUR_SOURCES'))} onMouseOut={tooltip.bind(null, null)}>{translate('armour sources')}</h2>
          <PieChart data={armourSourcesData} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_DAMAGE_TAKEN'))} onMouseOut={tooltip.bind(null, null)}>{translate('damage taken')}(%)</h2>
          <VerticalBarChart data={armourDamageTakenData} yMax={100} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_EFFECTIVE_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('effective armour')}</h2>
          <VerticalBarChart data={effectiveArmourData} />
        </div>
      </span>);
  }
}
