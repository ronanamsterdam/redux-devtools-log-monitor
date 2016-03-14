import React, { PropTypes } from 'react';
import brighten from './brighten';
import shouldPureComponentUpdate from 'react-pure-render/function';

const styles = {
  base: {
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: 3,
    padding: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 5,
    marginBottom: 5,
    flexGrow: 1,
    display: 'inline-block',
    fontSize: '0.8em',
    color: 'white',
    textDecoration: 'none'
  }
};

export default class LogMonitorButton extends React.Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

  static propTypes = {
    isFileButton: PropTypes.bool,
    onClick: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.onClick = this.onClick.bind(this);

    this.state = {
      hovered: false,
      active: false
    };
  }

  handleMouseEnter() {
    this.setState({ hovered: true });
  }

  handleMouseLeave() {
    this.setState({ hovered: false });
  }

  handleMouseDown() {
    this.setState({ active: true });
  }

  handleMouseUp() {
    this.setState({ active: false });
  }

  onClick(event) {
    if (!this.props.enabled) {
      return;
    }
    if (this.props.onClick) {
      this.props.onClick(event);
    }
  }

  render() {
    let style = {
      ...styles.base,
      backgroundColor: this.props.theme.base02
    };
    if (this.props.enabled && this.state.hovered) {
      style = {
        ...style,
        backgroundColor: brighten(this.props.theme.base02, 0.2)
      };
    }
    if (!this.props.enabled) {
      style = {
        ...style,
        opacity: 0.2,
        cursor: 'text',
        backgroundColor: 'transparent'
      };
    }

    var hiddenInputStyle = {
      height:   '0.1px',
      opacity:  '0',
      overflow: 'hidden',
      position: 'absolute',
      width:    '0.1px',
      zIndex:    -1
    };

    var labelStyle = {
      cursor:   'pointer',
      display:  'block'
    };

    return (
      <div>
        { !this.props.isFileButton?
          <a onMouseEnter={this.handleMouseEnter}
              onMouseLeave={this.handleMouseLeave}
              onMouseDown={this.handleMouseDown}
              onMouseUp={this.handleMouseUp}
              onClick={this.onClick}
              style={style}>
            {this.props.children}
          </a>
          :
          <div onMouseEnter={this.handleMouseEnter}
              onMouseLeave={this.handleMouseLeave}
              onMouseDown={this.handleMouseDown}
              onMouseUp={this.handleMouseUp}
              style={style}>
            <input
              id='descriptor-load'
              style={hiddenInputStyle}
              type='file'/>
            <label
              htmlFor='descriptor-load'
              onClick={this.onClick}
              style={labelStyle}>
              {this.props.children}
            </label>
          </div>
        }
      </div>
    );
  }
}
