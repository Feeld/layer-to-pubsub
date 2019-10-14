const DEBUG_DEFAULT = 'error'

function logReal () {
  console.log.apply( console, arguments)
}

function errorReal () {
  console.log.apply( console, arguments)
}

function noop () {}

const realLoggers = {
  log: logReal,
  error: errorReal
}

function getLogFunc (name, debug) {

  if (debug.includes(name)) {
    const realLogger = realLoggers[name]
    realLogger.enabled = true
    return realLogger
  }
  else {
    return noop
  }
}

let logger = null


module.exports = () => {

  if (logger) return logger

  logger = {}

  const debug = process.env.DEBUG || DEBUG_DEFAULT
  console.log('process.env.DEBUG:', debug)

  Object.keys(realLoggers).forEach( (name) => {
    logger[ name ] = getLogFunc(name, debug)
  })

  return logger
}
