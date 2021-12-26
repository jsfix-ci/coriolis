import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import { ListModifications, Modified } from './SvgIcons';
import AvailableModulesMenu from './AvailableModulesMenu';
import ModificationsMenu from './ModificationsMenu';
import { stopCtxPropagation, wrapCtxMenu } from '../utils/UtilityFunctions';
import { blueprintTooltip } from '../utils/BlueprintFunctions';
import { Module } from 'ed-forge';
import { TYPES } from 'ed-forge/lib/data/slots';
import autoBind from 'auto-bind';
import { toPairs } from 'lodash';

const HARDPOINT_SLOT_LABELS = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'H',
};

/**
 * Abstract Slot
 */
export default class Slot extends TranslatedComponent {
  static propTypes = {
    currentMenu: PropTypes.any,
    hideSearch: PropTypes.bool,
    m: PropTypes.instanceOf(Module),
    warning: PropTypes.func,
    drag: PropTypes.func,
    drop: PropTypes.func,
    dropClass: PropTypes.string,
    propsToShow: PropTypes.object.isRequired,
    onPropToggle: PropTypes.func.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = { menuIndex: 0 };
  }

  /**
   * Opens a menu while setting state.
   * @param {Object} newMenuIndex New menu index
   * @param {Event} event Event object
   */
  _openMenu(newMenuIndex, event) {
    const slotName = this.props.m.getSlot();
    if (
      this.props.currentMenu === slotName &&
      newMenuIndex === this.state.menuIndex
    ) {
      this.context.closeMenu();
    } {
      this.setState({ menuIndex: newMenuIndex });
      this.context.openMenu(slotName);
    }
    // If we don't stop event propagation, the underlying divs also might
    // get clicked which would open up other menus
    event.stopPropagation();
  }

  /**
   * Generate the slot contents
   * @return {React.Component}      Slot contents
   */
  _getSlotDetails() {
    const { m, propsToShow } = this.props;
    let { termtip, tooltip, language } = this.context;
    const { translate, units, formats } = language;

    if (m.isEmpty()) {
      return <div className="empty">
        {translate(
          m.isOnSlot(TYPES.MILITARY) ? 'emptyrestricted' : 'empty'
        )}
      </div>;
    } else {
      let classRating = m.getClassRating();
      let { drag, drop } = this.props;

      // Modifications tooltip shows blueprint and grade, if available
      let modTT = translate('modified');
      const blueprint = m.getBlueprint();
      const experimental = m.getExperimental();
      const grade = m.getBlueprintGrade();
      if (blueprint) {
        modTT = `${translate(blueprint)} ${translate('grade')}: ${grade}`;
        if (experimental) {
          modTT += `, ${translate(experimental)}`;
        }
        modTT = (
          <div>
            <div>{modTT}</div>
            {blueprintTooltip(language, m)}
          </div>
        );
      }

      let mass = m.get('mass') || m.get('cargo') || m.get('fuel') || 0;
      return (
        <div
          className={cn('details', { disabled: !m.isEnabled() })}
          draggable="true"
          onDragStart={drag}
          onDragEnd={drop}
        >
          <div className={'cb'}>
            <div className={'l'}>
              {classRating} {translate(m.readMeta('type'))}
              {blueprint && (
                <span
                  onMouseOver={termtip.bind(null, modTT)}
                  onMouseOut={tooltip.bind(null, null)}
                >
                  <Modified />
                </span>
              )}
            </div>
            {propsToShow.mass ?
              <div className={'r'}>
                {formats.round(mass)}
                {units.T}
              </div> : null}
          </div>
          <div className={'cb'}>
            {toPairs(propsToShow).sort().map(([prop, show]) => {
              const { unit, value } = m.getFormatted(prop, true);
              // Don't show mass again; it's already shown on the top right
              // corner of a slot
              if (!show || isNaN(value) || prop == 'mass') {
                return null;
              } else {
                return (<div className='l'>
                  {translate(prop)}: {formats.round(value)}{unit}
                </div>);
              }
            })}
            {(m.getApplicableBlueprints() || []).length > 0 ? (
              <div className="r">
                <button onClick={this._openMenu.bind(this, 1)}
                  onContextMenu={stopCtxPropagation}
                  onMouseOver={termtip.bind(null, translate('modifications'))}
                  onMouseOut={tooltip.bind(null, null)}
                >
                  <ListModifications />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
  }

  /**
   * Get the label for the slot size/class
   * Should be overriden if necessary
   * @return {string} label
   */
  _getMaxClassLabel() {
    const { m } = this.props;
    let size = m.getSize();
    switch (true) {
      case m.getSlot() === 'armour':
        return '';
      case size === 0:
        // This can also happen for armour but that case was handled above
        return 'U';
      case m.isOnSlot(TYPES.HARDPOINT):
        return HARDPOINT_SLOT_LABELS[size];
      default:
        return size;
    }
  }

  /**
   * Empty slot on right-click
   * @param  {SyntheticEvent} event Event
   */
  _contextMenu(event) {
    event.stopPropagation();
    event.preventDefault();
    const { m } = this.props;
    m.reset();
    if (this.props.currentMenu === m.getSlot()) {
      this.context.closeMenu();
    } else {
      this.forceUpdate();
    }
  }

  /**
   * Render the slot
   * @return {React.Component} The slot
   */
  render() {
    let language = this.context.language;
    let translate = language.translate;
    let {
      currentMenu, m, dropClass, dragOver, warning, hideSearch, propsToShow,
      onPropToggle,
    } = this.props;
    const { menuIndex } = this.state;

    // TODO: implement touch dragging
    const selected = currentMenu === m.getSlot();
    return (
      <div
        className={cn('slot', dropClass, { selected })}
        onContextMenu={this._contextMenu}
        onDragOver={dragOver} tabIndex="0"
        onClick={this._openMenu.bind(this, 0)}
      >
        <div className={cn(
          'details-container',
          { warning: warning && warning(m) },
        )}>
          <div className="sz">{this._getMaxClassLabel(translate)}</div>
          {this._getSlotDetails()}
        </div>
        {selected && menuIndex === 0 &&
          <AvailableModulesMenu
            m={m} hideSearch={hideSearch}
            onSelect={(item) => {
              m.setItem(item);
              this.context.closeMenu();
            }}
            warning={warning}
            // diffDetails={diffDetails.bind(ship, this.context.language)}
          />}
        {selected && menuIndex === 1 &&
          <ModificationsMenu m={m} propsToShow={propsToShow}
            onPropToggle={onPropToggle} />}
      </div>
    );
  }
}
