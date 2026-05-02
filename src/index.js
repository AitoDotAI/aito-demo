import React from 'react'
import ReactDOM from 'react-dom'
import App from './app/App'
import { installAitoTiming } from './services/aitoTiming'

import './app/styles/bootstrap.min.css'
import './app/index.css'

// Hook the global axios interceptor before any component mounts —
// powers the corner LatencyPill that shows `_predict 28ms` and
// friends as visitors click around. See src/services/aitoTiming.js.
installAitoTiming()

ReactDOM.render(<App />, document.getElementById('root'))

