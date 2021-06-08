#!/usr/bin/env node

import { program } from 'commander'
import { logger } from './logger'
import { loadEnv, ProxyConfig } from './config'

import { createInterface } from 'readline'
import { execSync } from 'child_process'
import { exit, stdin, stdout } from 'process'
import { writeFileSync, readFileSync, appendFileSync, mkdirSync } from 'fs'

interface Args {
  user: string
  password: string
  verbose: boolean
}

interface UserInfo {
  username: string
  password: string
}

interface ProxyInfo {
  username: string
  password: string
  hostname: string
  port: string
  httpProxy: string
  httpsProxy: string
  ftpProxy: string
  noProxy: string
}

interface CommandInfo {
  name: string
  proxyConfig: ProxyConfig
  login: (proxyInfo: ProxyInfo) => void
}

function createProxyInfo (userInfo: UserInfo, proxyConfig: ProxyConfig): ProxyInfo {
  return {
    username: userInfo.username,
    password: userInfo.password,
    hostname: proxyConfig.hostname,
    port: proxyConfig.port,
    httpProxy: `http://${userInfo.username}:${userInfo.password}@${proxyConfig.hostname}:${proxyConfig.port}`,
    httpsProxy: `https://${userInfo.username}:${userInfo.password}@${proxyConfig.hostname}:${proxyConfig.port}`,
    ftpProxy: `ftp://${userInfo.username}:${userInfo.password}@${proxyConfig.hostname}:${proxyConfig.port}`,
    noProxy: proxyConfig.noProxy
  }
}

async function question (message: string): Promise<string> {
  const readlineInterface = createInterface({
    input: stdin,
    output: stdout
  })

  return await new Promise((resolve) => {
    readlineInterface.question(message, (answer) => {
      resolve(answer)
      readlineInterface.close()
    })
  })
}

async function login (commandInfo: CommandInfo): Promise<void> {
  const userInfo: UserInfo = { username: '', password: '' }

  userInfo.username = await question('username: ')
  userInfo.password = await question('password: ')

  logger.info(`login to ${commandInfo.name} by user=${userInfo.username}, password=${userInfo.password}`)
  commandInfo.login(createProxyInfo(userInfo, commandInfo.proxyConfig))
}

async function loginPip (args: Args): Promise<void> {
  logger.verbose(args.verbose)
  try {
    const commandInfo: CommandInfo = {
      name: 'pip',
      proxyConfig: loadEnv(),
      login: (proxyInfo: ProxyInfo) => {
        // FIXME : Node.jsの中からでは環境変数をいじれず。shellに逃がすしかない？
        logger.info(execSync(`HTTP_PROXY=${proxyInfo.httpProxy}`).toString().trim())
        logger.info(execSync(`HTTPS_PROXY=${proxyInfo.httpsProxy}`).toString().trim())

        logger.info(execSync('echo $HTTP_PROXY').toString().trim())
        logger.info(execSync('echo $HTTPS_PROXY').toString().trim())
      }
    }
    await login(commandInfo)
  } catch (err) {
    logger.error(err)
    exit(0)
  }
}

async function loginNpm (args: Args): Promise<void> {
  logger.verbose(args.verbose)
  try {
    const commandInfo: CommandInfo = {
      name: 'npm',
      proxyConfig: loadEnv(),
      login: (proxyInfo: ProxyInfo) => {
        logger.info(execSync(`npm -g config set proxy ${proxyInfo.httpProxy}`).toString().trim())
        logger.info(execSync('npm -g config get proxy').toString().trim())

        logger.info(execSync(`npm -g config set https-proxy ${proxyInfo.httpsProxy}`).toString().trim())
        logger.info(execSync('npm -g config get https-proxy').toString().trim())

        logger.info(execSync('npm -g config set registry http://registry.npmjs.org/').toString().trim())
        logger.info(execSync('npm -g config get registry').toString().trim())
      }
    }
    await login(commandInfo)
  } catch (err) {
    logger.error(err)
    exit(0)
  }
}

async function loginGit (args: Args): Promise<void> {
  logger.verbose(args.verbose)
  try {
    const commandInfo: CommandInfo = {
      name: 'git',
      proxyConfig: loadEnv(),
      login: (proxyInfo: ProxyInfo) => {
        logger.info(execSync(`git config --global http.proxy ${proxyInfo.httpProxy}`).toString().trim())
        logger.info(execSync('git config --global --get http.proxy').toString().trim())

        logger.info(execSync(`git config --global https.proxy ${proxyInfo.httpsProxy}`).toString().trim())
        logger.info(execSync('git config --global --get https.proxy').toString().trim())
      }
    }
    await login(commandInfo)
  } catch (err) {
    logger.error(err)
    exit(0)
  }
}

async function loginGradle (args: Args): Promise<void> {
  logger.verbose(args.verbose)
  try {
    const proxyConfig = loadEnv()

    const commandInfo: CommandInfo = {
      name: 'gradle',
      proxyConfig: proxyConfig,
      login: (proxyInfo: ProxyInfo) => {
        const gradle = `${proxyConfig.home}/.gradle`
        const properties = `${gradle}/gradle.properties`

        mkdirSync(gradle, { recursive: true })

        writeFileSync(properties, '')

        appendFileSync(properties, `systemProp.http.proxyHost=${proxyInfo.hostname}\n`)
        appendFileSync(properties, `systemProp.http.proxyPort=${proxyInfo.port}\n`)
        appendFileSync(properties, `systemProp.http.proxyUser=${proxyInfo.username}\n`)
        appendFileSync(properties, `systemProp.http.proxyPassword=${proxyInfo.password}\n`)
        appendFileSync(properties, `systemProp.http.nonProxyHosts=${proxyInfo.noProxy}\n`)

        appendFileSync(properties, `systemProp.https.proxyHost=${proxyInfo.hostname}\n`)
        appendFileSync(properties, `systemProp.https.proxyPort=${proxyInfo.port}\n`)
        appendFileSync(properties, `systemProp.https.proxyUser=${proxyInfo.username}\n`)
        appendFileSync(properties, `systemProp.https.proxyPassword=${proxyInfo.password}\n`)
        appendFileSync(properties, `systemProp.https.nonProxyHosts=${proxyInfo.noProxy}\n`)

        logger.info(readFileSync(properties).toString().trim())
      }
    }

    await login(commandInfo)
  } catch (err) {
    logger.error(err)
    exit(0)
  }
}

program.exitOverride()

program
  .description('Login proxy server.')
  .option('-vv, --verbose', 'enable debug log', false)

program
  .command('npm')
  .action(loginNpm)

program
  .command('git')
  .action(loginGit)

program
  .command('pip')
  .action(loginPip)

program
  .command('gradle')
  .action(loginGradle)

program.parse(process.argv)
