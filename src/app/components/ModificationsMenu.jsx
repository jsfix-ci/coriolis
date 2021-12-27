import React from 'react';
import PropTypes from 'prop-types';
import { chain, flatMap, keys } from 'lodash';
import TranslatedComponent from './TranslatedComponent';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import cn from 'classnames';
import Modification from './Modification';
import {
  blueprintTooltip,
  specialToolTip
} from '../utils/BlueprintFunctions';
import { getBlueprintInfo, getExperimentalInfo } from 'ed-forge/lib/src/data/blueprints';
import { getModuleInfo } from 'ed-forge/lib/src/data/items';
import { SHOW } from '../shipyard/StatsMapping';

/**
 * Modifications menu
 */
export default class ModificationsMenu extends TranslatedComponent {
  static propTypes = {
    className: PropTypes.string,
    m: PropTypes.object.isRequired,
    propsToShow: PropTypes.object.isRequired,
    onPropToggle: PropTypes.func.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this._toggleBlueprintsMenu = this._toggleBlueprintsMenu.bind(this);
    this._toggleSpecialsMenu = this._toggleSpecialsMenu.bind(this);
    this.selectedModRef = null;
    this.selectedSpecialRef = null;

    const { m } = props;
    this.state = {
      blueprintProgress: m.getBlueprintProgress(),
      blueprintMenuOpened: !m.getBlueprint(),
      specialMenuOpened: false
    };
  }

  /**
   * Render the blueprints
   * @return {Object}         list: Array of React Components
   */
  _renderBlueprints() {
    const { m } = this.props;
    const { language, tooltip, termtip } = this.context;
    const { translate } = language;

    const blueprints = m.getApplicableBlueprints().map(blueprint => {
      const info = getBlueprintInfo(blueprint);
      let blueprintGrades = keys(info.features).map(grade => {
        // Grade is a string in the JSON so make it a number
        grade = Number(grade);
        const active = m.getBlueprint() === blueprint && m.getBlueprintGrade() === grade;
        const key = blueprint + ':' + grade;
        return <li key={key} data-id={key} className={cn('c', { active })}
          style={{ width: '2em' }}
          onMouseOver={termtip.bind(null, blueprintTooltip(language, m, blueprint, grade))}
          onMouseOut={tooltip.bind(null, null)}
          onClick={() => {
            m.setBlueprint(blueprint, grade, 1);
            this.setState({
              blueprintMenuOpened: false,
              specialMenuOpened: true,
            });
          }}
          ref={active ? (ref) => { this.selectedModRef = ref; } : undefined}
        >{grade}</li>;
      });

      return [
        <div key={'div' + blueprint} className={'select-group cap'}>
          {translate(blueprint)}
        </div>,
        <ul key={'ul' + blueprint}>{blueprintGrades}</ul>
      ];
    });

    return flatMap(blueprints);
  }

  /**
   * Render the specials
   * @param  {Object} props   React component properties
   * @param  {Object} context React component context
   * @return {Object}         list: Array of React Components
   */
  _renderSpecials() {
    const { m } = this.props;
    const { language, tooltip, termtip } = this.context;
    const translate = language.translate;

    const applied = m.getExperimental();
    const experimentals = [];
    for (const experimental of m.getApplicableExperimentals()) {
      const active = experimental === applied;
      let specialTt = specialToolTip(language, m, experimental);
      experimentals.push(
        <div key={experimental} data-id={experimental}
          style={{ cursor: 'pointer' }}
          className={cn('button-inline-menu', { active })}
          onClick={this._specialSelected(experimental)}
          ref={active ? (ref) => { this.selectedSpecialRef = ref; } : undefined}
          onMouseOver={termtip.bind(null, specialTt)}
          onMouseOut={tooltip.bind(null, null)}
        >{translate(experimental)}</div>
      );
    }

    if (experimentals.length) {
      experimentals.unshift(
        <div style={{ cursor: 'pointer', fontWeight: 'bold' }}
          className="button-inline-menu warning" key="none" data-id="none"
          // Setting the special effect to undefined clears it
          onClick={this._specialSelected(undefined)}
          ref={!applied ? (ref) => { this.selectedSpecialRef = ref; } : undefined}
        >{translate('PHRASE_NO_SPECIAL')}</div>
      );
    }

    return experimentals;
  }

  /**
   * Create a modification component
   */
  _mkModification(property, highlight) {
    const { translate } = this.context.language;
    const { m, propsToShow, onPropToggle } = this.props;

    let onSet = m.set.bind(m);
    // Show resistance instead of effectiveness
    const mapped = SHOW[property];
    if (mapped) {
      property = mapped.as;
      onSet = mapped.setter.bind(undefined, m);
    }

    return [
      <tr key={`th-${property}`}>
        <th colSpan="4">
          <span className="cb">{translate(property)}</span>
        </th>
      </tr>,
      <Modification key={property} m={m} property={property}
        onSet={onSet} highlight={highlight} showProp={propsToShow[property]}
        onPropToggle={onPropToggle} />
    ];
  }

  /**
   * Render the modifications
   * @return {Array}          Array of React Components
   */
  _renderModifications() {
    const { m } = this.props;

    const blueprintFeatures = getBlueprintInfo(m.getBlueprint()).features[
      m.getBlueprintGrade()
    ];
    const blueprintModifications = chain(keys(blueprintFeatures))
      .map((feature) => this._mkModification(feature, true))
      .filter(([_, mod]) => Boolean(mod))
      .flatMap()
      .value();
    const moduleModifications = chain(keys(getModuleInfo(m.getItem()).props))
      .filter((prop) => !blueprintFeatures[prop])
      .map((prop) => this._mkModification(prop, false))
      .flatMap()
      .value();

    return blueprintModifications.concat(moduleModifications);
  }

  /**
   * Toggle the blueprints menu
   */
  _toggleBlueprintsMenu() {
    this.setState({ blueprintMenuOpened: !this.state.blueprintMenuOpened });
  }

  /**
   * Toggle the specials menu
   */
  _toggleSpecialsMenu() {
    this.setState({ specialMenuOpened: !this.state.specialMenuOpened });
  }

  /**
   * Creates a callback for when a special effect is being selected
   * @param   {string} special The name of the selected special
   * @returns {function} Callback
   */
  _specialSelected(special) {
    return () => {
      const { m } = this.props;
      m.setExperimental(special);
      this.setState({ specialMenuOpened: false });
    };
  }

  /**
   * Set focus on first element in modifications menu
   * if component updates, unless update is due to value change
   * in a modification
   */
  componentDidUpdate() {
    if (this.selectedModRef) {
      this.selectedModRef.focus();
      return;
    } else if (this.selectedSpecialRef) {
      this.selectedSpecialRef.focus();
      return;
    }
  }

  /**
   * Render the list
   * @return {React.Component} List
   */
  render() {
    const { language, tooltip, termtip } = this.context;
    const translate = language.translate;
    const { m } = this.props;
    const {
      blueprintProgress, blueprintMenuOpened, specialMenuOpened,
    } = this.state;

    const appliedBlueprint = m.getBlueprint();
    const appliedGrade = m.getBlueprintGrade();
    const appliedExperimental = m.getExperimental();

    let renderComponents = [];
    switch (true) {
      case !appliedBlueprint || blueprintMenuOpened:
        renderComponents = this._renderBlueprints();
        break;
      case specialMenuOpened:
        renderComponents = this._renderSpecials();
        break;
      default:
        // Since the first case didn't apply, there is a blueprint applied so
        // we render the modifications
        let blueprintTt  = blueprintTooltip(language, m, appliedBlueprint, appliedGrade);

        renderComponents.push(
          <div style={{ cursor: 'pointer' }} key="blueprintsMenu"
            className="section-menu button-inline-menu"
            onMouseOver={termtip.bind(null, blueprintTt)}
            onMouseOut={tooltip.bind(null, null)}
            onClick={this._toggleBlueprintsMenu}
          >
            {translate(appliedBlueprint)} {translate('grade')} {appliedGrade}
          </div>
        );

        if (m.getApplicableExperimentals().length) {
          let specialLabel = translate('PHRASE_SELECT_SPECIAL');
          let specialTt;
          if (appliedExperimental) {
            specialLabel = appliedExperimental;
            specialTt = specialToolTip(language, m, appliedExperimental);
          }
          renderComponents.push(
            <div className="section-menu button-inline-menu"
              style={{ cursor: 'pointer' }}
              onMouseOver={specialTt ? termtip.bind(null, specialTt) : null}
              onMouseOut={specialTt ? tooltip.bind(null, null) : null}
              onClick={this._toggleSpecialsMenu}
            >{specialLabel}</div>
          );
        }

        renderComponents.push(
          <div
            className="section-menu button-inline-menu warning"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              m.resetEngineering();
              this.selectedModRef = null;
              this.selectedSpecialRef = null;
              tooltip(null);
              this.setState({
                blueprintMenuOpened: true,
                blueprintProgress: undefined,
              });
            }}
            onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RESET')}
            onMouseOut={tooltip.bind(null, null)}
          >{translate('reset')}</div>,
          <table style={{ width: '100%', backgroundColor: 'transparent' }}>
            <tbody>
              <tr>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: false },
                  )}
                >{translate('mroll')}:</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress === 0 },
                  )} style={{ cursor: 'pointer' }}
                  onClick={() => {
                    m.setBlueprintProgress(0);
                    this.setState({ blueprintProgress: 0 });
                  }}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_WORST')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('0%')}</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress === 0.5 },
                  )} style={{ cursor: 'pointer' }}
                  onClick={() => {
                    m.setBlueprintProgress(0.5);
                    this.setState({ blueprintProgress: 0.5 });
                  }}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_FIFTY')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('50%')}</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress === 1 },
                  )}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    m.setBlueprintProgress(1);
                    this.setState({ blueprintProgress: 1 });
                  }}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_BEST')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('100%')}</td>
                <td
                  className={cn(
                    'section-menu button-inline-menu',
                    { active: blueprintProgress % 0.5 !== 0 },
                  )}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const blueprintProgress = Math.random();
                    m.setBlueprintProgress(blueprintProgress);
                    this.setState({ blueprintProgress });
                  }}
                  onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RANDOM')}
                  onMouseOut={tooltip.bind(null, null)}
                >{translate('random')}</td>
              </tr>
            </tbody>
          </table>,
          <hr />,
          <span
            onMouseOver={termtip.bind(null, 'HELP_MODIFICATIONS_MENU')}
            onMouseOut={tooltip.bind(null, null)}
          >
            <table style={{ width: '100%' }}>
              <tbody>
                {this._renderModifications()}
              </tbody>
            </table>
          </span>
        );
    }

    return (
      <div className={cn('select', this.props.className)}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={stopCtxPropagation}
      >
        {renderComponents}
      </div>
    );
  }
}
