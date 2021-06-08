import debug from 'debug'

/**
 * Logger
 */
export const logger = {
  /** Error logger */
  error: debug('ERR'),

  /** Warning logger */
  warn: debug('WARN'),

  /** Information logger */
  info: debug('INFO'),

  /** Debug logger */
  debug: debug('DEBUG'),

  /** Enable verbose mode (enable DEBUG) */
  verbose: function (verbose: boolean): void {
    if (verbose) {
      debug.enable('ERR,INFO,WARN,DEBUG')
    } else {
      debug.enable('ERR,INFO,WARN')
    }
  }
}

logger.error.log = console.error.bind(console)
logger.warn.log = console.warn.bind(console)
logger.info.log = console.info.bind(console)
logger.debug.log = console.log.bind(console)
