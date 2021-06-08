import dotenv from 'dotenv'
import { logger } from './logger'

dotenv.config()

export interface ProxyConfig {
  home: string
  hostname: string
  port: string
  noProxy: string
}

export function loadEnv (): ProxyConfig {
  if (process.env.HOME === undefined) {
    logger.error('HOME in config.env is undefined')
    throw Error('HOME in config.env is undefined')
  }

  if (process.env.PROXY_HOST === undefined) {
    logger.error('PROXY_HOST in config.env is undefined')
    throw Error('PROXY_HOST in config.env is undefined')
  }

  if (process.env.PROXY_PORT === undefined) {
    logger.error('PROXY_PORT in config.env is undefined')
    throw Error('PROXY_PORT in config.env is undefined')
  }

  if (process.env.NO_PROXY === undefined) {
    logger.error('NO_PROXY in config.env is undefined')
    throw Error('NO_PROXY in config.env is undefined')
  }

  return {
    home: process.env.HOME,
    hostname: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    noProxy: process.env.NO_PROXY
  }
}
