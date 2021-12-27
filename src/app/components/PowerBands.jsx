import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import cn from 'classnames';
import TranslatedComponent from './TranslatedComponent';
import { wrapCtxMenu } from '../utils/UtilityFunctions';
import { Ship } from 'ed-forge';
import { POWER_METRICS } from 'ed-forge/lib/src/ship-stats';
import autoBind from 'auto-bind';

/**
 * Get the band-class.
 * @param  {Boolean} selected Band selected
 * @param  {Number} relDraw   Relative amount of power drawn by this band and
 * all prior
 * @return {string}           CSS Class name
 */
function getClass(selected, relDraw) {
  if (selected) {
    return 'secondary';
  } else if (relDraw >= 1) {
    return 'warning';
  } else {
    return 'primary';
  }
}

/**
 * Power Bands Component
 * Renders the SVG to simulate in-game power bands
 */
export default class PowerBands extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.instanceOf(Ship).isRequired,
    code: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);
    autoBind(this);
    this.wattScale = d3.scaleLinear();
    this.pctScale = d3.scaleLinear().domain([0, 1]);
    this.wattAxis = d3.axisTop(this.wattScale).tickSizeOuter(0).tickFormat(context.language.formats.r2);
    this.pctAxis = d3.axisBottom(this.pctScale).tickSizeOuter(0).tickFormat(context.language.formats.rPct);

    this._hidetip = () => this.context.tooltip();

    this.profile = props.ship.getMetrics(POWER_METRICS);
    this.state = {
      ret: {},
      dep: {}
    };

    if (props.width) {
      this._updateDimensions(props, context.sizeRatio);
    }
  }

  /**
   * Update dimensions based on properties and scale
   * @param  {Object} props   React Component properties
   * @param  {number} scale  size ratio / scale
   */
  _updateDimensions(props, scale) {
    let barHeight = Math.round(20 * scale);
    let innerHeight = (barHeight * 2) + 2;
    let mTop = Math.round(25 * scale);
    let mBottom = Math.round(25 * scale);
    let mLeft = Math.round(45 * scale);
    let mRight = Math.round(140 * scale);
    let innerWidth = props.width - mLeft - mRight;

    this.setState({
      barHeight,
      innerHeight,
      mTop,
      mBottom,
      mLeft,
      mRight,
      innerWidth,
      height: innerHeight + mTop + mBottom,
      retY: (barHeight / 2),
      depY: (barHeight * 1.5) - 1
    });
  }

  /**
   * Select no bands
   */
  _selectNone() {
    this.setState({
      ret : {},
      dep: {}
    });
  }

  /**
   * Select a retracted band
   * @param  {number} index Band index
   */
  _selectRet(index) {
    let ret = this.state.ret;
    if(ret[index]) {
      delete ret[index];
    } else {
      ret[index] = 1;
    }

    this.setState({ ret: Object.assign({}, ret) });
  }

  /**
   * Select a deployed band
   * @param  {number} index Band index
   */
  _selectDep(index) {
    let dep = this.state.dep;

    if(dep[index]) {
      delete dep[index];
    } else {
      dep[index] = 1;
    }

    this.setState({ dep: Object.assign({}, dep) });
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next context
   */
  componentWillReceiveProps(nextProps, nextContext) {
    let { language, sizeRatio } = this.context;
    if (language !== nextContext.language) {
      this.wattAxis.tickFormat(nextContext.language.formats.r2);
      this.pctAxis.tickFormat(nextContext.language.formats.rPct);
    }

    if (nextProps.width != this.props.width || sizeRatio != nextContext.sizeRatio) {
      this._updateDimensions(nextProps, nextContext.sizeRatio);
    }
  }

  /**
   * Assemble bands for relative consumption array.
   * @param {Number[]} consumed Array of relative-consumption numbers
   * @param {object} selected Object mapping selected bands to 1
   * @param {Number} yOffset Offset in y-direction of the bar
   * @param {Function} onClick onClick callback
   * @returns {React.Component} Bands
   */
  _consumedToBands(consumed, selected, yOffset, onClick) {
    const { state, wattScale } = this;
    const bands = [];
    let consumesPrev = 0;
    for (let i = 0; i < consumed.length; i++) {
      consumesPrev = consumed[i - 1] || consumesPrev;
      const consumes = consumed[i];

      if (!consumes) {
        continue;
      }

      bands.push(<rect
        key={'b' + i}
        width={Math.ceil(Math.max(wattScale(consumes - consumesPrev), 0))}
        height={state.barHeight}
        x={wattScale(consumesPrev)}
        y={yOffset + 1}
        onClick={onClick.bind(this, i)}
        className={getClass(selected[i], consumes)}
      />);

      bands.push(<text
        key={'t' + i}
        dy='0.5em'
        textAnchor='middle'
        height={state.barHeight}
        x={wattScale(consumesPrev) + (wattScale(consumes - consumesPrev) / 2)}
        y={yOffset + (state.barHeight / 2)}
        onClick={onClick.bind(this, i)}
        className='primary-bg'>{i + 1}</text>
      );
    }
    return bands;
  }

  /**
   * Render the power bands
   * @return {React.Component} Power bands
   */
  render() {
    if (!this.props.width) {
      return null;
    }

    let { pctScale, context, props, state } = this;
    let { translate, formats } = context.language;
    let { f2, pct1 } = formats; // wattFmt, pctFmt
    let { ship } = props;
    let { innerWidth, ret, dep, barHeight } = state;

    let {
      consumed, generated, relativeConsumed, relativeConsumedRetracted
    } = ship.getMetrics(POWER_METRICS);
    let maxPwr = Math.max(consumed, generated);
    let retSum = relativeConsumedRetracted[relativeConsumedRetracted.length - 1];
    let depSum = relativeConsumed[relativeConsumed.length - 1];

    this.wattScale.range([0, innerWidth]).domain([0, 1]).clamp(true);
    this.pctScale.range([0, innerWidth]).domain([0, maxPwr / generated]).clamp(true);

    let pwrWarningClass = cn('threshold', { exceeded: retSum > generated * 0.4 });
    let retracted = this._consumedToBands(relativeConsumedRetracted, ret, 0, this._selectRet);
    let deployed = this._consumedToBands(relativeConsumed, dep, barHeight, this._selectDep);
    let retSelected = Object.keys(ret).length > 0;
    let depSelected = Object.keys(dep).length > 0;

    return (
      <svg style={{ marginTop: '1em', width: '100%', height: state.height }} onContextMenu={wrapCtxMenu(this._selectNone)}>
        <g transform={`translate(${state.mLeft},${state.mTop})`}>
          <g className='power-band'>{retracted}</g>
          <g className='power-band'>{deployed}</g>
          <g ref={ (elem) => d3.select(elem).call(this.wattAxis) } className='watt axis'></g>
          <g ref={ (elem) => {
            let axis = d3.select(elem);
            axis.call(this.pctAxis);
            axis.select('g:nth-child(6)').selectAll('line, text').attr('class', pwrWarningClass);
          }} className='pct axis' transform={`translate(0,${state.innerHeight})`}></g>
          <line x1={pctScale(0.4)} x2={pctScale(0.4)} y1='0' y2={state.innerHeight} className={pwrWarningClass} />
          <text dy='0.5em' x='-3' y={state.retY} className='primary upp' textAnchor='end' onMouseOver={this.context.termtip.bind(null, 'retracted')} onMouseLeave={this._hidetip}>{translate('ret')}</text>
          <text dy='0.5em' x='-3' y={state.depY} className='primary upp' textAnchor='end' onMouseOver={this.context.termtip.bind(null, 'deployed', { orientation: 's', cap: 1 })} onMouseLeave={this._hidetip}>{translate('dep')}</text>
          <text dy='0.5em' x={innerWidth + 5} y={state.retY} className={getClass(retSelected, retSum, generated)}>{f2(Math.max(0, retSum * generated))} ({pct1(Math.max(0, retSum))})</text>
          <text dy='0.5em' x={innerWidth + 5} y={state.depY} className={getClass(depSelected, depSum, generated)}>{f2(Math.max(0, depSum * generated))} ({pct1(Math.max(0, depSum))})</text>
        </g>
      </svg>
    );
  }
}
