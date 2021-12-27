import React from 'react';
import SlotSection from './SlotSection';
import Slot from './Slot';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import autoBind from 'auto-bind';

/**
 * Utility Slot Section
 */
export default class UtilitySlotSection extends SlotSection {
  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props, 'utility mounts');
    autoBind(this);
  }

  /**
   * Empty all utility slots and close the menu
   */
  _empty() {
    this.props.ship.getUtilities().forEach((slot) => slot.reset());
    this._close();
  }

  /**
   * Mount module in utility slot, replace all if Alt is held
   * @param  {string} type  Module type
   * @param  {string} rating Module Rating
   * @param  {Synthetic} event  Event
   */
  _use(type, rating, event) {
    const fillAll = event.getModifierState('Alt');
    for (const slot of this.props.ship.getUtilities(undefined, true)) {
      if (slot.isEmpty() || fillAll) {
        slot.setItem(type, '', rating);
      }
    }
    this._close();
  }

  /**
   * Create all HardpointSlots (React component) for the slots
   * @return {Array} Array of HardpointSlots
   */
  _getSlots() {
    let slots = [];
    let { ship, currentMenu, propsToShow, onPropToggle } = this.props;
    let { originSlot, targetSlot } = this.state;

    for (let h of ship.getUtilities(undefined, true)) {
      slots.push(<Slot
        key={h.object.Slot}
        currentMenu={currentMenu}
        drag={this._drag.bind(this, h)}
        dragOver={this._dragOverSlot.bind(this, h)}
        drop={this._drop}
        dropClass={this._dropClass(h, originSlot, targetSlot)}
        m={h}
        enabled={h.enabled ? true : false}
        propsToShow={propsToShow}
        onPropToggle={onPropToggle}
      />);
    }

    return slots;
  }

  /**
   * Generate the section menu
   * @param  {Function} translate Translate function
   * @return {React.Component}   Section menu
   */
  _getSectionMenu() {
    const { translate } = this.context.language;
    let _use = this._use;

    return <div className='select' onClick={(e) => e.stopPropagation()} onContextMenu={stopCtxPropagation}>
      <ul>
        <li className='lc' tabIndex='0' onClick={this._empty}>{translate('empty all')}</li>
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
      <div className='select-group cap'>{translate('sb')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'shieldbooster', '5')}>A</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'shieldbooster', '4')}>B</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'shieldbooster', '3')}>C</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'shieldbooster', '2')}>D</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'shieldbooster', '1')}>E</li>
      </ul>
      <div className='select-group cap'>{translate('hs')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_use.bind(this, 'heatsinklauncher', '')}>{translate('Heat Sink Launcher')}</li>
      </ul>
      <div className='select-group cap'>{translate('ch')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_use.bind(this, 'chafflauncher', '')}>{translate('Chaff Launcher')}</li>
      </ul>
      <div className='select-group cap'>{translate('po')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_use.bind(this, 'pointdefence', '')}>{translate('Point Defence')}</li>
      </ul>
    </div>;
  }
}
