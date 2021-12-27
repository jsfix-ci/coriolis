import React from 'react';
import SlotSection from './SlotSection';
import Slot from './Slot';
import autoBind from 'auto-bind';
import { stopCtxPropagation, moduleGet } from '../utils/UtilityFunctions';
import { ShipProps, Module } from 'ed-forge';
import { getModuleInfo } from 'ed-forge/lib/src/data/items';
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
   * Resets all modules of the ship
   */
  _emptyAll() {
    this.props.ship.getModules().forEach((slot) => slot.reset());
    this._close();
  }

  /**
   * Sets all modules to a specific rating
   * @param {string} rating Module rating to set
   * @param {string} fsdPPException Custom rating for FSD
   */
  _nRated(rating, fsdPPException) {
    const { ship } = this.props;
    const pp = ship.getPowerPlant();
    pp.setItem('powerplant', pp.getSize(), fsdPPException || rating);
    const eng = ship.getThrusters();
    eng.setItem('thrusters', eng.getSize(), rating);
    const fsd = ship.getFSD();
    fsd.setItem('fsd', fsd.getSize(), fsdPPException || rating);
    const ls = ship.getLifeSupport();
    ls.setItem('lifesupport', ls.getSize(), rating);
    const pd = ship.getPowerDistributor();
    pd.setItem('powerdistributor', pd.getSize(), rating);
    const sen = ship.getSensors();
    sen.setItem('sensors', sen.getSize(), rating);
    this._close();
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
        <li className='lc' tabIndex="0" onClick={this._emptyAll}>{translate('empty all slots')}</li>
      </ul>
      <div className='select-group cap'>{translate('core')}</div>
      <ul>
        <li className='lc' tabIndex="0" onClick={this._nRated.bind(this, '5', undefined)}>{translate('A-rated')}</li>
        <li className='lc' tabIndex="0" onClick={this._nRated.bind(this, '2', undefined)}>{translate('D-rated')}</li>
        <li className='lc' tabIndex="0" onClick={this._nRated.bind(this, '2', '5')}>{translate('D-rated + A-rated FSD/PP')}</li>
      </ul>
    </div>;
  }
}
