# timetrack.desktop

Simple desktop 🖥️ application to track your time ⏰ spent on different projects 🎉.

## Screenshots

### Overview

![Overview](docs/screenshots/overview.png)

## Configuration

By default, there is no configuration file.
The application will NOT create one!

If you want to change the default configuration,
you have to create the configuration file yourself.

The configuration file should be located at:

 - Linux: `~/.config/timetrack/config.yml`.
 - Mac: `~/Library/Application Support/timetrack/config.yml`.
 - Windows: `%APPDATA%\timetrack\config.yml`.

> [!NOTE]
> Example configuration file for timetrack:

```yml
# Default value for database_file_path is
# Linux: ~/.config/timetrack/timetrack.db
# Mac: ~/Library/Application Support/timetrack/timetrack.db
# Windows: %APPDATA%\timetrack\timetrack.db
database_file_path="/home/marco/Desktop/timetrack.db"
```

## Development

Checkout the [development guide](docs/development.md) for more information.
