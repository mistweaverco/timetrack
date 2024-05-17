import { app } from 'electron'
import path from 'node:path'
import { access, mkdir, readFile } from 'node:fs/promises'
import yaml from 'js-yaml'

type UserConfigFile = null | {
  database_file_path: string
}

export const getUserDataPath = async (): Promise<string | null> => {
  const userDataPath = path.join(app.getPath('userData'), '..', 'timetrack')
  try {
    await access(userDataPath)
    return userDataPath
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('Creating user data path:', userDataPath)
      await mkdir(userDataPath, { recursive: true })
      return userDataPath
    } else {
      console.error('Error accessing user data path:', userDataPath)
      return null
    }
  }
}

export const getUserConfig = async (): Promise<UserConfigFile> => {
  const userDataPath = await getUserDataPath()
  const configFilePath = path.join(userDataPath, 'config.yml')
  try {
    await access(configFilePath)
    const content = await readFile(configFilePath, 'utf8')
    const config = yaml.load(content) as UserConfigFile
    console.warn('User config loaded ✨', config)
    return config
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(
        'No user file found, nothing special, no worries 🤷. Fallback to defaults 😇',
        configFilePath,
      )
    }
  }
  return null
}
