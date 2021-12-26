import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import { wrapCtxMenu } from '../utils/UtilityFunctions';
import { Equalizer } from '../components/SvgIcons';
import cn from 'classnames';
import { Ship } from 'ed-forge';
import autoBind from 'auto-bind';
const browser = require('detect-browser');

/**
 * Abstract Slot Section
 */
export default class SlotSection extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.instanceOf(Ship),
    code: PropTypes.string.isRequired,
    togglePwr: PropTypes.func,
    propsToShow: PropTypes.object.isRequired,
    onPropToggle: PropTypes.func.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {string} sectionName Section name
   */
  constructor(props, sectionName) {
    super(props);
    autoBind(this);

    this.sectionName = sectionName;

    this.state = {};
  }

  // Must be implemented by subclasses:
  //  _getSlots()
  //  _getSectionMenu()
  //  _contextMenu()
  //  componentDidUpdate(prevProps)

  /**
   * Slot Drag Handler
   * @param  {object} originSlot Origin slot model
   * @param  {Event} e           Drag Event
   */
  _drag(originSlot, e) {
    if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
      e.dataTransfer.setData('text/html', e.currentTarget);
    }
    e.dataTransfer.effectAllowed = 'copyMove';
    this.setState({ originSlot, copy: e.getModifierState('Alt') });
    this._close();
  }

  /**
   * Slot Drag Over Handler
   * @param  {object} targetSlot Potential drop target
   * @param  {Event} e           Drag Event
   */
  _dragOverSlot(targetSlot, e) {
    e.preventDefault();
    e.stopPropagation();
    let os = this.state.originSlot;
    if (os) {
      // Show correct icon
      const effect = this.state.copy ? 'copy' : 'move';
      if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
        e.dataTransfer.dropEffect = os != targetSlot && canMount(this.props.ship, targetSlot, os.m.grp, os.m.class) ? effect : 'none';
      }
      this.setState({ targetSlot });
    } else {
      if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
        e.dataTransfer.dropEffect = 'none';
      }
    }
  }

  /**
   * Drag over non-droppable target/element
   * @param  {Event} e   Drag Event
   */
  _dragOverNone(e) {
    e.preventDefault();
    if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
      e.dataTransfer.dropEffect = 'none';
    }
    this.setState({ targetSlot: null });
  }

  /**
   * Slot drop handler. If the target is eligible swap the origin and target modules.
   * If the target slot's current module cannot be mounted in the origin slot then
   * the origin slot will be empty.
   */
  _drop() {
    let { originSlot, targetSlot, copy } = this.state;
    let m = originSlot.m;

    if (targetSlot && originSlot != targetSlot) {
      if (copy) {
        // We want to copy the module in to the target slot
        if (targetSlot && canMount(this.props.ship, targetSlot, m.grp, m.class)) {
          const mCopy = m.clone();
          this.props.ship.use(targetSlot, mCopy, false);
          let experimentalNum = this.props.ship.hardpoints
            .filter(s => s.m && s.m.experimental).length;
          // Remove the module on the last slot if we now exceed the number of
          // experimentals allowed
          if (m.experimental && 4 < experimentalNum) {
            this.props.ship.updateStats(originSlot, null, originSlot.m);
            originSlot.m = null;  // Empty the slot
            originSlot.discountedCost = 0;
          }
          // Copy power info
          targetSlot.enabled = originSlot.enabled;
          targetSlot.priority = originSlot.priority;
        }
      } else {
        // Store power info
        const originEnabled = targetSlot.enabled;
        const originPriority = targetSlot.priority;
        const targetEnabled = originSlot.enabled;
        const targetPriority = originSlot.priority;
        // We want to move the module in to the target slot, and swap back any module that was originally in the target slot
        if (targetSlot && m && canMount(this.props.ship, targetSlot, m.grp, m.class)) {
          // Swap modules if possible
          if (targetSlot.m && canMount(this.props.ship, originSlot, targetSlot.m.grp, targetSlot.m.class)) {
            this.props.ship.use(originSlot, targetSlot.m, true);
            this.props.ship.use(targetSlot, m);
            // Swap power
            originSlot.enabled = originEnabled;
            originSlot.priority = originPriority;
            targetSlot.enabled = targetEnabled;
            targetSlot.priority = targetPriority;
          } else { // Otherwise empty the origin slot
            // Store power
            const targetEnabled = originSlot.enabled;
            this.props.ship.use(originSlot, null, true);  // Empty but prevent summary update
            this.props.ship.use(targetSlot, m);
            originSlot.enabled = 0;
            originSlot.priority = 0;
            targetSlot.enabled = targetEnabled;
            targetSlot.priority = targetPriority;
          }
          this.props.ship
            .updatePowerGenerated()
            .updatePowerUsed()
            .recalculateMass()
            .updateJumpStats()
            .recalculateShield()
            .recalculateShieldCells()
            .recalculateArmour()
            .recalculateDps()
            .recalculateEps()
            .recalculateHps()
            .updateMovement();
        }
      }
    }
    this.setState({ originSlot: null, targetSlot: null, copy: null });
  }

  /**
   * Determine drop eligibilty CSS class
   * @param  {Object} slot       Current slot
   * @param  {Object} originSlot Origin slot
   * @param  {Object} targetSlot Target slot
   * @return {string} CSS Class name
   */
  _dropClass(slot, originSlot, targetSlot) {
    if (!originSlot) {
      return null;
    }
    if (slot === originSlot) {
      if (targetSlot && targetSlot.m && !canMount(this.props.ship, originSlot, targetSlot.m.grp, targetSlot.m.class)) {
        return 'dropEmpty'; // Origin slot will be emptied
      }
      return null;
    }
    if (originSlot.m && canMount(this.props.ship, slot, originSlot.m.grp, originSlot.m.class)) { // Eligble drop slot
      if (slot === targetSlot) {
        return 'drop';  // Can drop
      }
      return 'eligible';  // Potential drop slot
    }

    return 'ineligible';  // Cannot be dropped / invalid drop slot
  }

  _open(newMenu, event) {
    event.preventDefault();
    event.stopPropagation();
    const { currentMenu } = this.props;
    if (currentMenu === newMenu) {
      this.context.closeMenu();
    } else {
      this.context.openMenu(newMenu);
    }
  }

  /**
   * Close current menu
   */
  _close() {
    if (this.props.currentMenu) {
      this.context.closeMenu();
    }
  }

  /**
   * Render the slot section
   * @return {React.Component} Slot section
   */
  render() {
    let translate = this.context.language.translate;
    let sectionMenuOpened = this.props.currentMenu === this.sectionName;

    return (
      <div className="group" onDragLeave={this._dragOverNone}>
        <div className={cn('section-menu', { selected: sectionMenuOpened })}
          onContextMenu={wrapCtxMenu(this._contextMenu)} onClick={this._open.bind(this, this.sectionName)}>
          <h1 tabIndex="0">{translate(this.sectionName)}<Equalizer/></h1>
          {sectionMenuOpened && this._getSectionMenu()}
        </div>
        {this._getSlots()}
      </div>
    );
  }
}
