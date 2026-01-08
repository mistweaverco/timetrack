import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { getUserConfig, getUserConfigDir } from './src/lib/ConfigFile'

const userConfig = await getUserConfig()
const userConfigDir = getUserConfigDir()
if (!userConfigDir) {
  throw new Error('Could not determine user data path for database file')
}
let sqlFilePath = path.join(userConfigDir, 'timetrack.db')
if (userConfig && userConfig.database_file_path) {
  sqlFilePath = userConfig.database_file_path
  console.warn('🗃️ Using custom database file path', sqlFilePath)
}
console.log('🗃️ Using database file path', sqlFilePath)
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL || `file:${sqlFilePath}`,
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  views: {
    path: path.join('prisma', 'views'),
  },
  typedSql: {
    path: path.join('prisma', 'queries'),
  },
})
