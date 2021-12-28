import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import Persist from '../stores/Persist';
import TranslatedComponent from './TranslatedComponent';
import PowerManagement from './PowerManagement';
import CostSection from './CostSection';
import EngineProfile from './EngineProfile';
import FSDProfile from './FSDProfile';
import Movement from './Movement';
import Offence from './Offence';
import Defence from './Defence';
import WeaponDamageChart from './WeaponDamageChart';
import Pips from '../components/Pips';
import Boost from '../components/Boost';
import Fuel from '../components/Fuel';
import Cargo from '../components/Cargo';
import ShipPicker from '../components/ShipPicker';
import EngagementRange from '../components/EngagementRange';
import autoBind from 'auto-bind';
import { ShipProps } from 'ed-forge';
const { CARGO_CAPACITY, FUEL_CAPACITY } = ShipProps;

/**
 * Outfitting subpages
 */
export default class OutfittingSubpages extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    code: PropTypes.string.isRequired,
    buildName: PropTypes.string,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    autoBind(this);

    this.props.ship.setOpponent(this.props.ship);
    this.state = {
      boost: false,
      cargo: props.ship.get(CARGO_CAPACITY),
      fuel: props.ship.get(FUEL_CAPACITY),
      pips: props.ship.getDistributorSettingsObject(),
      tab: Persist.getOutfittingTab() || 'power',
      engagementRange: 1000,
      opponent: this.props.ship,
    };
  }

  /**
   * Show selected tab
   * @param  {string} tab Tab name
   */
  _showTab(tab) {
    Persist.setOutfittingTab(tab);
    this.setState({ tab });
  }

  /**
   * Render the section
   * @return {React.Component} Contents
   */
  render() {
    const { buildName, code, ship } = this.props;
    const { boost, cargo, fuel, pips, tab, engagementRange, opponent } = this.state;
    const { translate } = this.context.language;

    const cargoCapacity = ship.get(CARGO_CAPACITY);
    const showCargoSlider = cargoCapacity > 0;
    return (
      <div>
        {/* Control of ship and opponent */}
        <div className="group quarter">
          <h2 style={{ verticalAlign: 'middle', textAlign: 'center' }}>
            {translate('ship control')}
          </h2>
          <Boost boost={boost} onChange={(boost) => this.setState({ boost })} />
        </div>
        <div className="group quarter">
          <h2 style={{ verticalAlign: 'middle', textAlign: 'center' }}>
            {translate('opponent')}
          </h2>
          <ShipPicker ship={ship} onChange={(opponent) => this.setState({ opponent })} />
        </div>
        <div className={cn('group', { quarter: showCargoSlider, half: !showCargoSlider })}>
          <Fuel fuelCapacity={ship.get(FUEL_CAPACITY)} fuel={fuel}
            onChange={(fuel) => this.setState({ fuel })} />
        </div>
        {showCargoSlider ?
          <div className="group quarter">
            <Cargo cargoCapacity={cargoCapacity} cargo={cargo}
              onChange={(cargo) => this.setState({ cargo })} />
          </div> : null}
        <div className="group half">
          <Pips ship={ship} pips={pips} onChange={(pips) => this.setState({ pips })} />
        </div>
        <div className="group half">
          <EngagementRange ship={ship} engagementRange={engagementRange}
            onChange={(engagementRange) => this.setState({ engagementRange })} />
        </div>
        <div className='group full' style={{ minHeight: '1000px' }}>
          <table className='tabs'>
            {/* Select tab section */}
            <thead>
              <tr>
                <th style={{ width:'25%' }} className={cn({ active: tab == 'power' })}
                  onClick={this._showTab.bind(this, 'power')}>
                  {translate('power and costs')}
                </th>
                <th style={{ width:'25%' }} className={cn({ active: tab == 'profiles' })}
                  onClick={this._showTab.bind(this, 'profiles')}>
                  {translate('profiles')}</th>
                <th style={{ width:'25%' }} className={cn({ active: tab == 'offence' })}
                  onClick={this._showTab.bind(this, 'offence')}>
                  {translate('offence')}
                </th>
                <th style={{ width:'25%' }} className={cn({ active: tab == 'defence' })}
                  onClick={this._showTab.bind(this, 'defence')}>
                  {translate('tab_defence')}
                </th>
              </tr>
            </thead>
          </table>
          {/* Show selected tab */}
          {tab == 'power' ?
            <div>
              <PowerManagement ship={ship} code={code} />
              <CostSection ship={ship} buildName={buildName} code={code} />
            </div> : null}
          {tab == 'profiles' ?
            <div>
              <div className='group third'>
                <h1>{translate('engine profile')}</h1>
                <EngineProfile code={code} ship={ship} fuel={fuel} cargo={cargo} pips={pips} boost={boost} />
              </div>
              <div className='group third'>
                <h1>{translate('fsd profile')}</h1>
                <FSDProfile code={code} ship={ship} fuel={fuel} cargo={cargo} />
              </div>
              <div className='group third'>
                <h1>{translate('movement profile')}</h1>
                <Movement code={code} ship={ship} boost={boost} pips={pips} />
              </div>
              <div className='group half'>
                <h1>{translate('damage to opponent\'s shields')}</h1>
                <WeaponDamageChart code={code} ship={ship} opponentDefence={opponent.getShield()} engagementRange={engagementRange} />
              </div>
              <div className='group half'>
                <h1>{translate('damage to opponent\'s hull')}</h1>
                <WeaponDamageChart code={code} ship={ship} opponentDefence={opponent.getArmour()} engagementRange={engagementRange} />
              </div>
            </div> : null}
          {tab == 'offence' ?
            <div>
              <Offence code={code} ship={ship} opponent={opponent} engagementRange={engagementRange} />
            </div> : null}
          {tab == 'defence' ?
            <div>
              <Defence code={code} ship={ship} opponent={opponent} engagementRange={engagementRange} />
            </div> : null}
        </div>
      </div>
    );
  }
}
