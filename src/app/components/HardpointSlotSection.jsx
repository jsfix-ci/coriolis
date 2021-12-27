import React from 'react';
import SlotSection from './SlotSection';
import Slot from './Slot';
import { MountFixed, MountGimballed, MountTurret } from '../components/SvgIcons';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import autoBind from 'auto-bind';

const SIZE_ORDER = ['huge', 'large', 'medium', 'small'];

/**
 * Hardpoint slot section
 */
export default class HardpointSlotSection extends SlotSection {
  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props, 'hardpoints');
    autoBind(this);
  }

  /**
   * Empty all slots
   */
  _empty() {
    this.props.ship.getHardpoints(undefined, true).forEach((slot) => slot.reset());
    this._close();
  }

  /**
   * Fill slots with specified module
   * @param  {string} type Type of item
   * @param  {string} rating Mount Type - (fixed, gimbal, turret)
   * @param  {SyntheticEvent} event Event
   */
  _fill(type, rating, event) {
    const fillAll = event.getModifierState('Alt');
    this.props.ship.getHardpoints(undefined, true).forEach((slot) => {
      if (slot.isEmpty() || fillAll) {
        const slotSize = slot.getSize();
        const fittingSizes = SIZE_ORDER.slice(SIZE_ORDER.findIndex((e) => e === slotSize));
        for (const size of fittingSizes) {
          try {
            slot.setItem(type, size, rating);
          } catch (err) {
            // Try next item if this doesn't fit/exist
            continue;
          }
          // If still here, we were able to apply the module
          break;
        }
      }
    });
    this._close();
  }

  /**
   * Generate the slot React Components
   * @return {Array} Array of Slots
   */
  _getSlots() {
    let { ship, currentMenu, propsToShow, onPropToggle } = this.props;
    let { originSlot, targetSlot } = this.state;
    let slots = [];

    for (let h of ship.getHardpoints(undefined, true)) {
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
   * Generate the section drop-down menu
   * @param  {Function} translate Translate function
   * @return {React.Component}    Section menu
   */
  _getSectionMenu() {
    const { translate } = this.context.language;
    let _fill = this._fill;

    return <div className='select hardpoint' onClick={(e) => e.stopPropagation()} onContextMenu={stopCtxPropagation}>
      <ul>
        <li className='lc' tabIndex="0" onClick={this._empty}>{translate('empty all')}</li>
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
      <div className='select-group cap'>{translate('pulselaser')}</div>
      <ul>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'pulselaser', 'fixed')}><MountFixed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'pulselaser', 'gimbal')}><MountGimballed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'pulselaser', 'turret')}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('burstlaser')}</div>
      <ul>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'burstlaser', 'fixed')}><MountFixed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'burstlaser', 'gimbal')}><MountGimballed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'burstlaser', 'turret')}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('beamlaser')}</div>
      <ul>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'beamlaser', 'fixed')}><MountFixed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'beamlaser', 'gimbal')}><MountGimballed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'beamlaser', 'turret')}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('multicannon')}</div>
      <ul>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'multicannon', 'fixed')}><MountFixed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'multicannon', 'gimbal')}><MountGimballed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'multicannon', 'turret')}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('cannon')}</div>
      <ul>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'cannon', 'fixed')}><MountFixed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'cannon', 'gimbal')}><MountGimballed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'cannon', 'turret')}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('fragcannon')}</div>
      <ul>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'fragcannon', 'fixed')}><MountFixed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'fragcannon', 'gimbal')}><MountGimballed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'fragcannon', 'turret')}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('plasmaacc')}</div>
      <ul>
        <li className='lc' tabIndex="0"  onClick={_fill.bind(this, 'plasmaacc', 'fixed')}>{translate('pa')}</li>
      </ul>
      <div className='select-group cap'>{translate('railgun')}</div>
      <ul>
        <li className='lc' tabIndex="0"  onClick={_fill.bind(this, 'railgun', 'fixed')}>{translate('rg')}</li>
      </ul>
      <div className='select-group cap'>{translate('minelauncher')}</div>
      <ul>
        <li className='lc' tabIndex="0" onClick={_fill.bind(this, 'minelauncher', 'fixed')}>{translate('nl')}</li>
      </ul>
      <div className='select-group cap'>{translate('flaklauncher')}</div>
      <ul>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'flaklauncher', 'fixed')}><MountFixed className='lg'/></li>
        <li className="c hardpoint" tabIndex="0" onClick={_fill.bind(this, 'flaklauncher', 'turret')}><MountTurret className='lg'/></li>
      </ul>
    </div>;
  }
}
