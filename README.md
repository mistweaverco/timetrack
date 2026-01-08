# timetrack

Simple desktop 🖥️ application to track your time ⏰ spent on different projects 🎉.

## Screenshots

### Overview

![Overview](assets/screenshots/overview.png)

## Configuration

By default, there is no configuration file.
The application will NOT create one!

If you want to change the default configuration,
you have to create the configuration file yourself.

The configuration file should be located at:

- Linux: `~/.config/timetrack/config.yaml`.
- Mac: `~/Library/Application Support/timetrack/config.yaml`.
- Windows: `%APPDATA%\timetrack\config.yaml`.

> [!NOTE]
> Example configuration file for timetrack:

```yaml
# Default value for database_file_path is
# Linux: ~/.config/timetrack/timetrack.db
# Mac: ~/Library/Application Support/timetrack/timetrack.db
# Windows: %APPDATA%\timetrack\timetrack.db
database_file_path="/home/marco/Desktop/timetrack.db"
```

## Development

Checkout the [development guide](docs/development.md) for more information.
