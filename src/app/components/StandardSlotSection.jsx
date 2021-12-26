import React from 'react';
import cn from 'classnames';
import SlotSection from './SlotSection';
import Slot from './Slot';
import autoBind from 'auto-bind';
import { stopCtxPropagation, moduleGet } from '../utils/UtilityFunctions';
import { ShipProps, Module } from 'ed-forge';
const { CONSUMED_RETR, LADEN_MASS } = ShipProps;

/**
 * Standard Slot section
 */
export default class StandardSlotSection extends SlotSection {
  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props) {
    super(props, 'core internal');
    autoBind(this);
  }

  /**
   * Use the lightest/optimal available standard modules
   */
  _optimizeStandard() {
    this.props.ship.useLightestStandard();
    this._close();
  }

  /**
   * Fill all standard slots with the specificed rating (using max class)
   * @param  {Boolean} shielded True if shield generator should be included
   * @param {integer} bulkheadIndex Bulkhead to use see Constants.BulkheadNames
   */
  _multiPurpose(shielded, bulkheadIndex) {
    ShipRoles.multiPurpose(this.props.ship, shielded, bulkheadIndex);
    this._close();
  }

  /**
   * Trader Build
   * @param  {Boolean} shielded True if shield generator should be included
   */
  _optimizeCargo(shielded) {
    ShipRoles.trader(this.props.ship, shielded);
    this._close();
  }

  /**
   * Miner Build
   * @param  {Boolean} shielded True if shield generator should be included
   */
  _optimizeMiner(shielded) {
    ShipRoles.miner(this.props.ship, shielded);
    this._close();
  }

  /**
   * Explorer role
   * @param  {Boolean} planetary True if Planetary Vehicle Hangar (PVH) should be included
   */
  _optimizeExplorer(planetary) {
    ShipRoles.explorer(this.props.ship, planetary);
    this._close();
  }

  /**
   * Racer role
   */
  _optimizeRacer() {
    ShipRoles.racer(this.props.ship);
    this._close();
  }

  /**
   * On right click optimize the standard modules
   */
  _contextMenu() {
    this._optimizeStandard();
  }

  /**
   * Creates a new slot for a given module.
   * @param {Module} m Module to create the slot for
   * @param {function} warning Warning callback
   * @return {React.Component} Slot component
   */
  _mkSlot(m, warning) {
    const { currentMenu, propsToShow, onPropToggle } = this.props;
    return <Slot key={m.getSlot()} m={m} warning={warning} hideSearch={true}
      currentMenu={currentMenu} propsToShow={propsToShow} onPropToggle={onPropToggle}
    />;
  }

  /**
   * Generate the slot React Components
   * @return {Array} Array of Slots
   */
  _getSlots() {
    const { ship } = this.props;
    const fsd = ship.getFSD();
    return [
      this._mkSlot(ship.getAlloys()),
      this._mkSlot(
        ship.getPowerPlant(),
        (m) => moduleGet(m, 'powercapacity') < ship.get(CONSUMED_RETR),
      ),
      this._mkSlot(
        ship.getThrusters(),
        (m) => moduleGet(m, 'enginemaximalmass') < ship.get(LADEN_MASS),
      ),
      this._mkSlot(fsd),
      this._mkSlot(
        ship.getPowerDistributor(),
        (m) => moduleGet(m, 'enginescapacity') <= ship.readProp('boostenergy'),
      ),
      this._mkSlot(ship.getLifeSupport()),
      this._mkSlot(ship.getSensors()),
      this._mkSlot(
        ship.getCoreFuelTank(),
        (m) => moduleGet(m, 'fuel') < fsd.get('maxfuel')
      ),
    ];
  }

  /**
   * Generate the section drop-down menu
   * @param  {Function} translate Translate function
   * @return {React.Component}    Section menu
   */
  _getSectionMenu() {
    const { translate } = this.context.language;
    return <div className='select' onClick={(e) => e.stopPropagation()} onContextMenu={stopCtxPropagation}>
      <ul>
        <li className='lc' tabIndex="0" onClick={this._optimizeStandard}>{translate('Maximize Jump Range')}</li>
      </ul>
      <div className='select-group cap'>{translate('roles')}</div>
      <ul>
        <li className='lc' tabIndex="0" onClick={this._multiPurpose.bind(this, false, 0)}>{translate('Multi-purpose')}</li>
        <li className='lc' tabIndex="0" onClick={this._multiPurpose.bind(this, true, 2)}>{translate('Combat')}</li>
        <li className='lc' tabIndex="0" onClick={this._optimizeCargo.bind(this, true)}>{translate('Trader')}</li>
        <li className='lc' tabIndex="0" onClick={this._optimizeExplorer.bind(this, false)}>{translate('Explorer')}</li>
        <li className='lc' tabIndex="0" onClick={this._optimizeExplorer.bind(this, true)}>{translate('Planetary Explorer')}</li>
        <li className='lc' tabIndex="0" onClick={this._optimizeMiner.bind(this, true)}>{translate('Miner')}</li>
        <li className='lc' tabIndex="0" onClick={this._optimizeRacer.bind(this)}>{translate('Racer')}</li>
      </ul>
    </div>;
  }
}
