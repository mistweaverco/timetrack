import os from 'node:os'
import logger from 'node-color-log'
import path from 'node:path'
import { access, mkdir, readFile } from 'node:fs/promises'
import yaml from 'js-yaml'

type UserConfigFile = null | {
  database_file_path: string
}

export function getUserConfigDir() {
  const appName = 'timetrack'

  const platform = process.platform

  if (platform === 'win32') {
    // Windows: C:\Users\<User>\AppData\Roaming
    return (
      process.env.APPDATA ||
      path.join(os.homedir(), 'AppData', 'Roaming', appName)
    )
  }

  if (platform === 'darwin') {
    // macOS: /Users/<User>/Library/Preferences
    return path.join(os.homedir(), 'Library', 'Preferences', appName)
  }

  // Linux and other POSIX: /home/<user>/.config (per XDG spec)
  return process.env.XDG_CONFIG_HOME
    ? path.join(process.env.XDG_CONFIG_HOME, appName)
    : path.join(os.homedir(), '.config', appName)
}

export const getDBFilePath = async (): Promise<string> => {
  const userConfigDir = getUserConfigDir()
  try {
    await access(userConfigDir)
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      logger.error('📢 Creating user config dir:', userConfigDir)
      await mkdir(userConfigDir, { recursive: true })
    }
  }
  const dbFilePath = path.join(userConfigDir, 'timetrack.db')
  return dbFilePath
}

export const getUserConfig = async (): Promise<UserConfigFile> => {
  const userConfigDir = getUserConfigDir()
  const configFilePath = path.join(userConfigDir, 'config.yaml')
  try {
    await access(configFilePath)
    const content = await readFile(configFilePath, 'utf8')
    const config = yaml.load(content) as UserConfigFile
    logger.warn('User config loaded ✨', config)
    return config
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      logger.info(
        '📢 No user file found, nothing special, no worries 🤷. Fallback to defaults 😇',
        configFilePath,
      )
    }
  }
  return null
}
