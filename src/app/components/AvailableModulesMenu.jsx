import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import cn from 'classnames';
import { MountFixed, MountGimballed, MountTurret } from './SvgIcons';
import FuzzySearch from 'react-fuzzy';
import { getModuleInfo } from 'ed-forge/lib/data/items';
import { groupBy, mapValues, sortBy } from 'lodash';
import autoBind from 'auto-bind';

const PRESS_THRESHOLD = 500; // mouse/touch down threshold

const MOUNT_MAP = {
  fixed: <MountFixed className={'lg'} />,
  gimbal: <MountGimballed className={'lg'} />,
  turret: <MountTurret className={'lg'} />,
};

/**
 * Available modules menu
 */
export default class AvailableModulesMenu extends TranslatedComponent {
  static propTypes = {
    onSelect: PropTypes.func.isRequired,
    diffDetails: PropTypes.func,
    hideSearch: PropTypes.bool,
    m: PropTypes.object,
    warning: PropTypes.func,
    slotDiv: PropTypes.object
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);
    autoBind(this);
    this.state = this._initState(props, context);
  }

  /**
   * Initiate the list of available moduels
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   * @return {Object}         list: Array of React Components, currentGroup Component if any
   */
  _initState(props, context) {
    const { translate } = context.language;
    const { m } = props;
    const list = [], fuzzy = [];
    let currentGroup;

    const modules = m.getApplicableItems().map(getModuleInfo);
    const groups = mapValues(
      groupBy(modules, (info) => info.meta.group),
      (infos) => groupBy(infos, (info) => info.meta.type),
    );
    // Build categories sorted by translated category name
    const groupKeys = sortBy(Object.keys(groups), translate);
    for (const group of groupKeys) {
      const groupName = translate(group);
      if (groupKeys.length > 1) {
        list.push(<div key={`group-${group}`} className="select-category upp">{groupName}</div>);
      }

      const categories = groups[group];
      const categoryKeys = sortBy(Object.keys(categories), translate);
      for (const category of categoryKeys) {
        const categoryName = translate(category);
        const infos = categories[category];
        if (categoryKeys.length > 1) {
          list.push(<div key={`category-${category}`} className="select-group cap">{categoryName}</div>);
        }
        list.push(
          this._buildGroup(
            m,
            category,
            infos,
          ),
        );
        fuzzy.push(
          ...infos.map((info) => {
            const { meta } = info;
            const mount = meta.mount ? ' ' + translate(meta.mount) : '';
            return {
              grp: groupName,
              cat: categoryName,
              m: info.proto.Item,
              name: `${meta.class}${meta.rating}${mount} ${categoryName}`,
            };
          }),
        );
      }
    }
    return { list, currentGroup, fuzzy, trackingFocus: false };
  }

  /**
   * Generate React Components for Module Group
   * @param  {Object} mountedModule Mounted Module
   * @param  {String} category      Category key
   * @param  {Array} modules        Available modules
   * @return {React.Component}      Available Module Group contents
   */
  _buildGroup(mountedModule, category, modules) {
    const { warning } = this.props;
    const ship = mountedModule.getShip();
    const classMapping = groupBy(modules, (info) => info.meta.class);

    const itemsPerClass = Math.max(
      ...Object.values(classMapping).map((l) => l.length),
    );
    const itemsPerRow = itemsPerClass <= 2 ? 6 : itemsPerClass;
    // Nested array of <li> elements; will be flattened before being rendered.
    // Each sub-array represents one row in the final view.
    const elems = [[]];

    // Reverse sort for descending order of module class
    for (const clazz of Object.keys(classMapping).sort().reverse()) {
      for (let info of sortBy(
        classMapping[clazz],
        (info) => info.meta.mount || info.meta.rating,
      )) {
        const { meta } = info;
        const { Item } = info.proto;

        // Can only be true if shieldgenmaximalmass is defined, i.e. this
        // module must be a shield generator
        let disabled = info.props.shieldgenmaximalmass < ship.readProp('hullmass');
        if (meta.experimental && !mountedModule.readMeta('experimental')) {
          disabled =
            4 <=
            ship.getHardpoints().filter((m) => m.readMeta('experimental'))
              .length;
        }

        // Default event handlers for objects that are disabled
        let eventHandlers = {};
        if (!disabled) {
          const showDiff = this._showDiff.bind(this, mountedModule, info);
          const select = (event) => {
            this._hideDiff(event);
            this.props.onSelect(Item);
          };

          eventHandlers = {
            onMouseEnter: this._over.bind(this, showDiff),
            onTouchStart: this._touchStart.bind(this, showDiff),
            onTouchEnd: this._touchEnd.bind(this, select),
            onMouseLeave: this._hideDiff,
            onClick: select,
          };
        }

        const mountSymbol = MOUNT_MAP[meta.mount] || '';
        const li = (
          <li key={Item} data-id={Item}
            ref={Item === mountedModule.getItem() ? (ref) => { this.activeSlotRef = ref; } : undefined}
            className={cn(meta.type === 'armour' ? 'lc' : 'c', {
              warning: !disabled && warning && warning(info),
              active: mountedModule.getItem() === Item,
              disabled,
              hardpoint: mountSymbol,
            })}
            {...eventHandlers}
          >{meta.type === 'armour' ? Item : `${mountSymbol}${meta.class}${meta.rating}`}</li>
        );

        const tail = elems.pop();
        let newTail = [tail];
        if (tail.length < itemsPerRow) {
          // If the row has not grown too long, the new <li> element can be
          // added to the row itself
          tail.push(li);
        } else {
          // Otherwise, the last row gets a line break element added and this
          // item is put into a new row
          tail.push(<br key={elems.length}/>);
          newTail.push([li]);
        }
        elems.push(...newTail);
      }
    }

    return <ul key={'ul' + category}>{[].concat(...elems)}</ul>;
  }

  /**
   * Generate tooltip content for the difference between the
   * mounted module and the hovered modules
   * @param  {Object} mountedModule    The module mounted currently
   * @param  {Object} hoveringModule     The hovered module
   * @param  {DOMRect} rect DOMRect for target element
   */
  _showDiff(mountedModule, hoveringModule, rect) {
    if (this.props.diffDetails) {
      this.touchTimeout = null;
      // TODO:
      // this.context.tooltip(
      //   this.props.diffDetails(hoveringModule, mountedModule),
      //   rect,
      // );
    }
  }

  /**
   * Generate tooltip content for the difference between the
   * mounted module and the hovered modules
   * @returns {React.Component} Search component if available
   */
  _showSearch() {
    if (this.props.hideSearch) {
      return;
    }
    return (
      <FuzzySearch
        list={this.state.fuzzy}
        keys={['grp', 'name']}
        tokenize={true}
        className={'input'}
        width={'100%'}
        style={{ padding: 0 }}
        onSelect={e => this.props.onSelect.bind(null, e.m)()}
        resultsTemplate={(props, state, styles, clickHandler) => {
          return state.results.map((val, i) => {
            return (
              <div
                key={i}
                className={'lc'}
                onClick={() => clickHandler(i)}
              >
                {val.name}
              </div>
            );
          });
        }}
      />
    );
  }

  /**
   * Mouse over diff handler
   * @param  {Function} showDiff diff tooltip callback
   * @param  {SyntheticEvent} event Event
   */
  _over(showDiff, event) {
    event.preventDefault();
    showDiff(event.currentTarget.getBoundingClientRect());
  }

  /**
   * Toucch Start - Show diff after press, otherwise treat as tap
   * @param  {Function} showDiff diff tooltip callback
   * @param  {SyntheticEvent} event Event
   */
  _touchStart(showDiff, event) {
    event.preventDefault();
    let rect = event.currentTarget.getBoundingClientRect();
    this.touchTimeout = setTimeout(showDiff.bind(this, rect), PRESS_THRESHOLD);
  }

  /**
   * Touch End - Select module on tap
   * @param  {Function} select Select module callback
   * @param  {SyntheticEvent} event Event
   */
  _touchEnd(select, event) {
    event.preventDefault();
    if (this.touchTimeout !== null) {  // If timeout has not fired (been nulled out) yet
      select();
    }
    this._hideDiff();
  }

  /**
   * Hide diff tooltip
   * @param  {SyntheticEvent} event Event
   */
  _hideDiff(event) {
    clearTimeout(this.touchTimeout);
    this.touchTimeout = null;
    this.context.tooltip();
  }

  /**
   * Scroll to mounted (if it exists) module group on mount
   */
  componentDidMount() {
    if (this.activeSlotRef) {
      this.activeSlotRef.focus();
    }
  }

  /**
   * Handle focus if the component updates
   *
   */
  componentWillUnmount() {
    if (this.props.slotDiv) {
      this.props.slotDiv.focus();
    }
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   */
  componentWillReceiveProps(nextProps, nextContext) {
    this.setState(this._initState(nextProps, nextContext));
  }

  /**
   * Render the list
   * @return {React.Component} List
   */
  render() {
    return (
      <div ref={node => this.node = node}
        className={cn('select', this.props.className)}
        onScroll={this._hideDiff}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={stopCtxPropagation}
      >
        {this._showSearch()}
        {this.state.list}
      </div>
    );
  }
}
