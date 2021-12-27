import React from 'react';
import SlotSection from './SlotSection';
import Slot from './Slot';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import autoBind from 'auto-bind';
import { TYPES } from 'ed-forge/lib/src/data/slots';

/**
 * Sets all empty slots of a ship to a item of the given size.
 * @param {Ship} ship Ship to set items for
 * @param {boolean} fillAll True to also fill occupied
 * @param {string} type Item type
 * @param {string} rating Item rating
 */
function setAllEmpty(ship, fillAll, type, rating = '') {
  ship.getModules(TYPES.ANY_INTERNAL, undefined, true).forEach((slot) => {
    if (slot.isEmpty() || fillAll) {
      try {
        // Maybe the item does not exist. Simply catch this error.
        slot.setItem(type, slot.getSize(), rating);
      } catch (e) {}
    }
  });
}

/**
 * Internal slot section
 */
export default class InternalSlotSection extends SlotSection {
  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props, 'optional internal');
    autoBind(this);
  }

  /**
   * Empty all slots
   */
  _empty() {
    this.props.ship.getModules(TYPES.ANY_INTERNAL).forEach((slot) => slot.reset());
    this._close();
  }

  /**
   * Fill all slots with cargo racks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithCargo(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'cargorack');
    this._close();
  }

  /**
   * Fill all slots with fuel tanks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithFuelTanks(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'fueltank', '3');
    this._close();
  }

  /**
   * Fill all slots with luxury passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithLuxuryCabins(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'passengercabins', '4');
    this._close();
  }

  /**
   * Fill all slots with first class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithFirstClassCabins(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'passengercabins', '3');
    this._close();
  }

  /**
   * Fill all slots with business class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithBusinessClassCabins(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'passengercabins', '2');
    this._close();
  }

  /**
   * Fill all slots with economy class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithEconomyClassCabins(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'passengercabins', '1');
    this._close();
  }

  /**
   * Fill all slots with Shield Cell Banks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithCells(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'scb', '5');
    this._close();
  }

  /**
   * Fill all slots with Hull Reinforcement Packages
   * @param  {SyntheticEvent} event Event
   */
  _fillWithArmor(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'hrp', '2');
    this._close();
  }

  /**
   * Fill all slots with Module Reinforcement Packages
   * @param  {SyntheticEvent} event Event
   */
  _fillWithModuleReinforcementPackages(event) {
    const fillAll = event.getModifierState('Alt');
    setAllEmpty(this.props.ship, fillAll, 'mrp', '2');
    this._close();
  }

  /**
   * Generate the slot React Components
   * @return {Array} Array of Slots
   */
  _getSlots() {
    let slots = [];
    let { currentMenu, ship, propsToShow, onPropToggle } = this.props;
    let { originSlot, targetSlot } = this.state;

    for (const m of ship.getInternals(undefined, true)) {
      slots.push(<Slot
        key={m.object.Slot}
        currentMenu={currentMenu}
        m={m}
        drag={this._drag.bind(this, m)}
        dragOver={this._dragOverSlot.bind(this, m)}
        drop={this._drop}
        dropClass={this._dropClass(m, originSlot, targetSlot)}
        propsToShow={propsToShow}
        onPropToggle={onPropToggle}
      />);
    }

    return slots;
  }

  /**
   * Generate the section drop-down menu
   * @param  {Function} translate Translate function
   * @param  {Function} ship      The ship
   * @return {React.Component}    Section menu
   */
  _getSectionMenu() {
    const { ship } = this.props;
    const { translate } = this.context.language;
    return <div className='select' onClick={e => e.stopPropagation()} onContextMenu={stopCtxPropagation}>
      <ul>
        <li className='lc' tabIndex='0' onClick={this._empty}>{translate('empty all')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithCargo}>{translate('cargo')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithCells}>{translate('scb')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithArmor}>{translate('hr')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithModuleReinforcementPackages}>{translate('mrp')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithFuelTanks}>{translate('ft')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithEconomyClassCabins}>{translate('pce')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithBusinessClassCabins}>{translate('pci')}</li>
        <li className='lc' tabIndex='0' onClick={this._fillWithFirstClassCabins} onKeyDown={ship.luxuryCabins ? '' : this._keyDown}>{translate('pcm')}</li>
        { ship.readMeta('luxuryCabins') ? <li className='lc' tabIndex='0' onClick={this._fillWithLuxuryCabins}>{translate('pcq')}</li> : ''}
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
    </div>;
  }
}
