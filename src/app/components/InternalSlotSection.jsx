import React from 'react';
import SlotSection from './SlotSection';
import Slot from './Slot';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import autoBind from 'auto-bind';

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
    // TODO:
    // this.props.ship.emptyInternal();
    this._close();
  }

  /**
   * Fill all slots with cargo racks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithCargo(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'cr')) {
        ship.use(slot, ModuleUtils.findInternal('cr', slot.maxClass, 'E'));
      }
    });
    this._close();
  }

  /**
   * Fill all slots with fuel tanks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithFuelTanks(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'ft')) {
        ship.use(slot, ModuleUtils.findInternal('ft', slot.maxClass, 'C'));
      }
    });
    this._close();
  }

  /**
   * Fill all slots with luxury passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithLuxuryCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pcq')) {
        ship.use(slot, ModuleUtils.findInternal('pcq', Math.min(slot.maxClass, 6), 'B')); // Passenger cabins top out at 6
      }
    });
    this._close();
  }

  /**
   * Fill all slots with first class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithFirstClassCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pcm')) {
        ship.use(slot, ModuleUtils.findInternal('pcm', Math.min(slot.maxClass, 6), 'C')); // Passenger cabins top out at 6
      }
    });
    this._close();
  }

  /**
   * Fill all slots with business class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithBusinessClassCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pci')) {
        ship.use(slot, ModuleUtils.findInternal('pci', Math.min(slot.maxClass, 6), 'D')); // Passenger cabins top out at 6
      }
    });
    this._close();
  }

  /**
   * Fill all slots with economy class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithEconomyClassCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pce')) {
        ship.use(slot, ModuleUtils.findInternal('pce', Math.min(slot.maxClass, 6), 'E')); // Passenger cabins top out at 6
      }
    });
    this._close();
  }

  /**
   * Fill all slots with Shield Cell Banks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithCells(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    let chargeCap = 0; // Capacity of single activation
    ship.internal.forEach(function(slot) {
      if ((clobber && !(slot.m && ModuleUtils.isShieldGenerator(slot.m.grp)) || !slot.m) && canMount(ship, slot, 'scb')) {
        ship.use(slot, ModuleUtils.findInternal('scb', slot.maxClass, 'A'));
        ship.setSlotEnabled(slot, chargeCap <= ship.shieldStrength); // Don't waste cell capacity on overcharge
        chargeCap += slot.m.recharge;
      }
    });
    this._close();
  }

  /**
   * Fill all slots with Hull Reinforcement Packages
   * @param  {SyntheticEvent} event Event
   */
  _fillWithArmor(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'hr')) {
        ship.use(slot, ModuleUtils.findInternal('hr', Math.min(slot.maxClass, 5), 'D')); // Hull reinforcements top out at 5D
      }
    });
    this._close();
  }

  /**
   * Fill all slots with Module Reinforcement Packages
   * @param  {SyntheticEvent} event Event
   */
  _fillWithModuleReinforcementPackages(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'mrp')) {
        ship.use(slot, ModuleUtils.findInternal('mrp', Math.min(slot.maxClass, 5), 'D')); // Module reinforcements top out at 5D
      }
    });
    this._close();
  }

  /**
   * Empty all on section header right click
   */
  _contextMenu() {
    this._empty();
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
        { ship.luxuryCabins ? <li className='lc' tabIndex='0' onClick={this._fillWithLuxuryCabins}>{translate('pcq')}</li> : ''}
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
    </div>;
  }
}
