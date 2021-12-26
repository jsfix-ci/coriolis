import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import TranslatedComponent from './TranslatedComponent';
import Persist from '../stores/Persist';
import autoBind from 'auto-bind';
import { isArray } from 'lodash';
import { Ship } from 'ed-forge';

const STATE = {
  READY: 0,
  PARSED: 1,
  ERROR: 2,
};

/**
 * Import Modal
 */
export default class ModalImport extends TranslatedComponent {
  static propTypes = {
    builds: PropTypes.object,  // Optional: Import object
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    autoBind(this);

    this.state = {
      status: STATE.READY,
      builds: props.builds || [],
    };
  }

  /**
   * Validate the import string / text box contents
   * @param  {SyntheticEvent} event Event
   * @throws {string} If validation fails
   */
  _parse(event) {
    const importString = event.target.value.trim();
    try {
      let data = JSON.parse(importString);
      if (!isArray(data)) {
        data = [data];
      }

      const ships = data.map((item) => {
        try {
          return new Ship(item.data ? item.data : item);
        } catch (err) {
          return err;
        }
      });
      this.setState({ ships, status: STATE.PARSED });
    } catch (err) {
      this.setState({ err, status: STATE.ERROR });
    }
  }

  /**
   * Process imported data
   */
  _process() {
    for (const build of this.state.builds) {
      if (!build instanceof Error) {
        Persist.saveBuild(build.Ship, build.CoriolisBuildName || build.ShipName, build.compress());
      }
    }
    this.setState({ builds: [], status: STATE.READY });
  }

  /**
   * Capture build name changes
   * @param {Object} index Build/Comparison import object
   * @param {SyntheticEvent} event Event
   */
  _changeName(index, event) {
    const { builds } = this.state;
    builds[index].CoriolisBuildName = event.target.value.trim();
    this.setState({ builds });
  }

  /**
   * If textarea is shown focus on mount
   */
  componentDidMount() {
    if (!this.props.builds && this.importField) {
      this.importField.focus();
    }
  }

  /**
   * Render the import modal
   * @return {React.Component} Modal contents
   */
  render() {
    const { translate } = this.context.language;
    const { status, builds, err } = this.state;

    const buildRows = builds.map((build, i) => {
      if (build instanceof Error) {
        return <tr key={i} className='cb'>
          <td colSpan={3} className='warning'>Error: {build.name}</td>
        </tr>;
      }

      const exists = Persist.hasBuild(build.Ship, build.CoriolisBuildName);
      const saveName = build.CoriolisBuildName || build.ShipName;
      return <tr key={i} className='cb'>
        <td>{translate(build.Ship)}</td>
        <td><input type='text' onChange={this._changeName.bind(this, i)} value={saveName}/></td>
        <td style={{ textAlign: 'center' }} className={cn('cap', { warning: exists, disabled: saveName === '' })}>
          {translate(saveName === '' ? 'skip'  : (exists ? 'overwrite' : 'create'))}
        </td>
      </tr>;
    });

    return <div className='modal' onClick={ (e) => e.stopPropagation() }>
      <h2 >{translate('import')}</h2>
      <div>
        <textarea spellCheck={false} className='cb json' ref={node => this.importField = node} onChange={this._parse} defaultValue={this.state.importString} placeholder={translate('PHRASE_IMPORT')} />
        {status === STATE.ERROR && <div className='l warning' style={{ marginLeft:'3em' }}>{err.toString()}</div>}
      </div>
      {builds.length && <div>
        <table className='l' style={{ overflow:'hidden', margin: '1em 0', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }} >{translate('ship')}</th>
              <th style={{ textAlign: 'left' }} >{translate('build name')}</th>
              <th>{translate('action')}</th>
            </tr>
          </thead>
          <tbody>
            {buildRows}
          </tbody>
        </table>
      </div>}
      <button id='proceed' className='l cap' onClick={this._process}
        disabled={status !== STATE.PARSED} >
        {translate('proceed')}
      </button>
      <button className={'r dismiss cap'} onClick={this.context.hideModal}>
        {translate('close')}
      </button>
    </div>;
  }
}
