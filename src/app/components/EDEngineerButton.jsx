import React from 'react';
import autoBind from 'auto-bind';
import Persist from '../stores/Persist';
import PropTypes from 'prop-types';
import { getBlueprintUuid, getExperimentalUuid } from 'ed-forge/lib/data/blueprints';
import { Loader, MatIcon } from '../components/SvgIcons';
import request from 'superagent';
import { chain, entries } from 'lodash';
import TranslatedComponent from './TranslatedComponent';

const STATE = {
  READY: 0,
  LOADING: 1,
  ERROR: 2,
  DONE: 3,
};

/**
 *
 */
export default class EDEngineerButton extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    autoBind(this);

    const { ship } = props;
    const uuids = chain(ship.getModules())
      .filter((m) => m.getBlueprint())
      .map((m) => {
        const uuids = [getBlueprintUuid(m.getBlueprint(), m.getBlueprintGrade())];
        const exp = m.getExperimental();
        if (exp) {
          uuids.push(getExperimentalUuid(exp));
        }
        return uuids;
      })
      .flatMap()
      .groupBy()
      .mapValues((v) => v.length)
      .value();

    this.state = {
      status: STATE.READY,
      uuids,
    };
  }

  /**
   * Generates the shopping list
   */
  _sendToEDEngineer() {
    const { uuids } = this.state;
    this.setState({ status: STATE.LOADING });
    request.get('http://localhost:44405/commanders')
      .then((data) => {
        const [cmdr] = JSON.parse(data.text);
        return Promise.all(
          entries(uuids).map(
            (entry) => {
              const [uuid, n] = entry;
              return new Promise((resolve, reject) => {
                request.patch(`http://localhost:44405/${cmdr}/shopping-list`)
                  .field('uuid', uuid)
                  .field('size', n)
                  .end((err, res) => {
                    console.log('request goes out!');
                    if (err) {
                      reject(err);
                    } else {
                      resolve(res);
                    }
                  });
              });
            },
          ),
        );
      })
      .then(() => this.setState({ status: STATE.DONE }))
      .catch((err) => {
        console.error(err);
        this.setState({ status: STATE.ERROR });
      });
  }

  /**
   * Checks for browser compatibility of sending to ED Engineer.
   * @returns {boolean} True if browser is compatible
   */
  _browserIsCompatible() {
    // !== Firefox 1.0+
    // TODO: Double check if this really doesn't work in firefox
    return typeof InstallTrigger === 'undefined';
  }

  /**
   *
   * @returns
   */
  render() {
    const { termtip, tooltip } = this.context;
    const hide = tooltip.bind(null, null);
    const { status } = this.state;

    let msg = 'PHRASE_FIREFOX_EDENGINEER';
    if (this._browserIsCompatible()) {
      switch (status) {
        case STATE.READY: msg = 'Send to EDEngineer'; break;
        case STATE.LOADING: msg = 'Sending...'; break;
        case STATE.ERROR: msg = 'Error sending to EDEngineer'; break;
        case STATE.DONE: msg = 'Success! Clicking sends again.'; break;
      }
    }

    return (<button
      disabled={!this._browserIsCompatible()}
      onClick={status !== STATE.LOADING && this._sendToEDEngineer}
      onMouseOver={termtip.bind(null, msg)}
      onMouseOut={hide}
    >
      {status === STATE.LOADING ?
        <Loader className="lg" /> :
        <MatIcon className="lg" />
      }
    </button>);
  }
}
