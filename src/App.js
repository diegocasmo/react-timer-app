import React, { useReducer } from 'react'
import { useInterval } from './use-interval'

const actionTypes = {
  tick: 'tick',
  play: 'play',
  pause: 'pause',
  stop: 'stop',
}

const initialState = {
  tick: null,
  timeEntries: [],
}

// The number of ms since the unix epoch (a.k.a. "now")
const now = () => new Date().getTime()

// Create a new time entry starting "now" by default
const startTimeEntry = (time = now()) => ({
  startedAt: time,
  elapsedMs: null,
})

// Stop the given time entry at "now" by default
const stopTimeEntry = (timeEntry, time = now()) => ({
  ...timeEntry,
  elapsedMs: time - timeEntry.startedAt,
})

// Return true if a time entry is running, false otherwise
const isTimeEntryRunning = ({ elapsedMs }) => elapsedMs === null

// Return true if a time entry is paused, false otherwise
const isTimeEntryPaused = ({ elapsedMs }) => elapsedMs !== null

// Get the current time entry, which is always the latest one
const getCurrTimeEntry = (state) =>
  state.timeEntries[state.timeEntries.length - 1]

// Return true if the timer is stopped, false otherwise
const isStopped = (state) => state.timeEntries.length === 0

// Return true if the timer is running, false otherwise
const isRunning = (state) =>
  state.timeEntries.length > 0 && isTimeEntryRunning(getCurrTimeEntry(state))

// Return true if the timer is paused, false otherwise
const isPaused = (state) =>
  state.timeEntries.length > 0 && isTimeEntryPaused(getCurrTimeEntry(state))

// Return the total number of elapsed ms
const getElapsedMs = (state) => {
  if (isStopped(state)) return 0

  return state.timeEntries.reduce(
    (acc, timeEntry) =>
      isTimeEntryPaused(timeEntry)
        ? acc + timeEntry.elapsedMs
        : acc + (now() - timeEntry.startedAt),
    0
  )
}

const timerReducer = (state, { type, payload }) => {
  switch (type) {
    case actionTypes.tick:
      return { ...state, tick: payload }
    case actionTypes.play:
      if (isRunning(state)) return state

      return {
        ...state,
        timeEntries: state.timeEntries.concat(startTimeEntry(payload)),
      }
    case actionTypes.pause:
      if (isStopped(state)) return state
      if (isPaused(state)) return state

      const currTimeEntry = getCurrTimeEntry(state)
      return {
        ...state,
        timeEntries: state.timeEntries
          .slice(0, -1)
          .concat(stopTimeEntry(currTimeEntry)),
      }
    case actionTypes.stop:
      return { ...state, timeEntries: [] }
    default:
      throw new Error(`Unhandled type: ${type}`)
  }
}

const useTimer = () => {
  const [state, dispatch] = useReducer(timerReducer, initialState)

  const pause = () => dispatch({ type: actionTypes.pause, payload: now() })
  const play = () => dispatch({ type: actionTypes.play, payload: now() })
  const stop = () => dispatch({ type: actionTypes.stop })
  const tick = () => dispatch({ type: actionTypes.tick, payload: now() })

  const running = isRunning(state)
  const elapsedMs = getElapsedMs(state)

  return {
    pause,
    play,
    running,
    stop,
    tick,
    elapsedMs,
  }
}

const Timer = () => {
  const { pause, play, running, stop, tick, elapsedMs } = useTimer()

  const zeroPad = (x) => (x > 9 ? x : `0${x}`)
  const seconds = Math.floor((elapsedMs / 1000) % 60)
  const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60)
  const hours = Math.floor((elapsedMs / (1000 * 60 * 60)) % 24)

  useInterval(() => {
    tick()
  }, 1000)

  return (
    <div>
      <p>
        {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
      </p>
      {running ? (
        <button onClick={pause}>pause</button>
      ) : (
        <button onClick={play}>play</button>
      )}
      <button onClick={stop}>stop</button>
    </div>
  )
}

const App = () => {
  return <Timer />
}

export default App
