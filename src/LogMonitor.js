import React, { PropTypes, Component } from 'react';
import LogMonitorEntry from './LogMonitorEntry';
import LogMonitorButton from './LogMonitorButton';
import shouldPureComponentUpdate from 'react-pure-render/function';
import * as themes from 'redux-devtools-themes';
import { ActionCreators } from 'redux-devtools';
import { updateScrollTop } from './actions';
import reducer from './reducers';

const { reset, rollback, commit, sweep, toggleAction, importState } = ActionCreators;

const styles = {
  container: {
    fontFamily: 'monaco, Consolas, Lucida Console, monospace',
    position: 'relative',
    overflowY: 'hidden',
    width: '100%',
    height: '100%',
    minWidth: 300,
    direction: 'ltr'
  },
  buttonBar: {
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: 'transparent',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'row'
  },
  elements: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 38,
    bottom: 0,
    overflowX: 'hidden',
    overflowY: 'auto'
  }
};

var valueIsDefined = function(value) {
  return value !== undefined && value !== false && value !== null;
}

export default class LogMonitor extends Component {
  static update = reducer;

  static propTypes = {
    persistentStateLocalStoreKey: PropTypes.string.isRequired,
    loadValidationCb: PropTypes.func,
    dispatch: PropTypes.func,
    computedStates: PropTypes.array,
    actionsById: PropTypes.object,
    stagedActionIds: PropTypes.array,
    skippedActionIds: PropTypes.array,
    monitorState: PropTypes.shape({
      initialScrollTop: PropTypes.number
    }),

    preserveScrollTop: PropTypes.bool,
    select: PropTypes.func.isRequired,
    theme: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string
    ]),
    expandActionRoot: PropTypes.bool,
    expandStateRoot: PropTypes.bool
  };

  static defaultProps = {
    select: (state) => state,
    theme: 'nicinabox',
    preserveScrollTop: true,
    expandActionRoot: true,
    expandStateRoot: true
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  constructor(props) {
    super(props);
    this.handleToggleAction = this.handleToggleAction.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleRollback = this.handleRollback.bind(this);
    this.handleSweep = this.handleSweep.bind(this);
    this.handleCommit = this.handleCommit.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }

  scroll() {
    const node = this.refs.container;
    if (!node) {
      return;
    }
    if (this.scrollDown) {
      const { offsetHeight, scrollHeight } = node;
      node.scrollTop = scrollHeight - offsetHeight;
      this.scrollDown = false;
    }
  }

  componentDidMount() {
    const node = this.refs.container;
    if (!node) {
      return;
    }

    if (this.props.preserveScrollTop) {
      node.scrollTop = this.props.monitorState.initialScrollTop;
      this.interval = setInterval(::this.updateScrollTop, 1000);
    } else {
      this.scrollDown = true;
      this.scroll();
    }
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  updateScrollTop() {
    const node = this.refs.container;
    this.props.dispatch(updateScrollTop(node ? node.scrollTop : 0));
  }

  componentWillReceiveProps(nextProps) {
    const node = this.refs.container;
    if (!node) {
      this.scrollDown = true;
    } else if (
      this.props.stagedActionIds.length <
      nextProps.stagedActionIds.length
    ) {
      const { scrollTop, offsetHeight, scrollHeight } = node;

      this.scrollDown = Math.abs(
        scrollHeight - (scrollTop + offsetHeight)
      ) < 20;
    } else {
      this.scrollDown = false;
    }
  }

  componentDidUpdate() {
    this.scroll();
  }

  handleRollback() {
    this.props.dispatch(rollback());
  }

  handleSweep() {
    this.props.dispatch(sweep());
  }

  handleCommit() {
    this.props.dispatch(commit());
  }

  handleToggleAction(id) {
    this.props.dispatch(toggleAction(id));
  }

  handleReset() {
    this.props.dispatch(reset());
  }

  handleSave(event) {
    let storeState = localStorage.getItem(this.props.persistentStateLocalStoreKey);

    if(storeState) {
      let text = storeState;
      let name = 'savedState.json';
      let type = 'application/json';

      var a = event.target;
      var file = new Blob([text], {type: type});
      a.href = URL.createObjectURL(file);
      a.download = name;
    }
  }

  handleLoad(event) {
    var fileInputChangeHandler = function fileInputChangeListener(inputChangeEvent) {
        if(inputChangeEvent.target.files[0]) {
          let file = inputChangeEvent.target.files[0];
          let reader = new FileReader();

          reader.onloadend = (e) => {
            try {
              let fileLoadResult = e.target.result;

              //because that's how you clear the FileList :/
              inputChangeEvent.target.value = '';

              let newMonitorState = JSON.parse(fileLoadResult);

              if( this.props.loadValidationCb && !this.props.loadValidationCb(newMonitorState)) {
                console.error("{LogMonitor} 😤 Loaded stuff did not passed validation. I'm ain't loading that!" + (e.massage || e));
              } else {
                var action = importState();

                action.nextLiftedState = newMonitorState;

                this.props.dispatch(action);
              }
            } catch(e) {
              console.error("{LogMonitor} 😤 Well something went wrong when I tried to parse that bro! Make sure that's a valid JSON file! " + (e.massage || e));
            }
          }

          reader.onerror = () => {
            console.error('{LogMonitor} 😤 Well something when I tried to load that file bro!');
          }

          reader.readAsText(file);
        }

        fileInput.removeEventListener('change', fileInputChangeHandler);
      }.bind(this);
      let fileInput = document.getElementById(event.target.htmlFor);

      if(fileInput) {
        fileInput.addEventListener('change', fileInputChangeHandler);
      }
  }

  getTheme() {
    let { theme } = this.props;
    if (typeof theme !== 'string') {
      return theme;
    }

    if (typeof themes[theme] !== 'undefined') {
      return themes[theme];
    }

    console.warn('DevTools theme ' + theme + ' not found, defaulting to nicinabox');
    return themes.nicinabox;
  }

  render() {
    const elements = [];
    const theme = this.getTheme();
    const { actionsById, skippedActionIds, stagedActionIds, computedStates, select } = this.props;

    for (let i = 0; i < stagedActionIds.length; i++) {
      const actionId = stagedActionIds[i];
      const action = actionsById[actionId].action;
      const { state, error } = computedStates[i];
      let previousState;
      if (i > 0) {
        previousState = computedStates[i - 1].state;
      }
      elements.push(
        <LogMonitorEntry key={actionId}
                         theme={theme}
                         select={select}
                         action={action}
                         actionId={actionId}
                         state={state}
                         previousState={previousState}
                         collapsed={skippedActionIds.indexOf(actionId) > -1}
                         error={error}
                         expandActionRoot={this.props.expandActionRoot}
                         expandStateRoot={this.props.expandStateRoot}
                         onActionClick={this.handleToggleAction} />
      );
    }

    return (
      <div style={{...styles.container, backgroundColor: theme.base00}}>
        <div style={{...styles.buttonBar, borderColor: theme.base02}}>
          <LogMonitorButton
            theme={theme}
            onClick={this.handleReset}
            enabled>
            Reset
          </LogMonitorButton>
          <LogMonitorButton
            theme={theme}
            onClick={this.handleRollback}
            enabled={computedStates.length > 1}>
            Revert
          </LogMonitorButton>
          <LogMonitorButton
            theme={theme}
            onClick={this.handleSweep}
            enabled={skippedActionIds.length > 0}>
            Sweep
          </LogMonitorButton>
          <LogMonitorButton
            theme={theme}
            onClick={this.handleCommit}
            enabled={computedStates.length > 1}>
            Commit
          </LogMonitorButton>
          <LogMonitorButton
            theme={theme}
            onClick={this.handleSave}
            enabled>
            Save
          </LogMonitorButton>
          <LogMonitorButton
            theme={theme}
            onClick={this.handleLoad}
            isFileButton={true}
            enabled>
            Load
          </LogMonitorButton>
        </div>
        <div style={styles.elements} ref='container'>
          {elements}
        </div>
      </div>
    );
  }
}
