# ADB MCP 服务器

这是一个用于 Android Debug Bridge (ADB) 的 MCP 服务器，使 Claude 能够与 Android 设备进行交互。

## 工具列表

1. `get-devices`

   - 列出已连接的 Android 设备
   - 可选参数：
     - `showDetails` (布尔值, 默认: true): 显示设备详细信息 (-l)

2. `list-packages`

   - 列出设备上已安装的软件包
   - 可选参数：
     - `showPath` (布尔值, 默认: false): 显示 APK 文件路径 (-f)
     - `showDisabled` (布尔值, 默认: false): 仅显示已禁用的包 (-d)
     - `showEnabled` (布尔值, 默认: false): 仅显示已启用的包 (-e)
     - `showSystem` (布尔值, 默认: false): 仅显示系统包 (-s)
     - `showThirdParty` (布尔值, 默认: false): 仅显示第三方包 (-3)
     - `showInstaller` (布尔值, 默认: false): 显示包安装程序 (-i)
     - `includeUninstalled` (布尔值, 默认: false): 包含已卸载的包 (-u)

3. `input-text`

   - 向设备输入文本
   - 必需参数：
     - `text` (字符串): 要输入的文本

4. `install-apk`

   - 安装 APK 文件到设备
   - 必需参数：
     - `apkPath` (字符串): APK 文件路径
   - 可选参数：
     - `allowReinstall` (布尔值, 默认: true): 允许重新安装 (-r)
     - `allowTestPackages` (布尔值, 默认: true): 允许测试包 (-t)
     - `allowDowngrade` (布尔值, 默认: true): 允许降级 (-d)
     - `grantPermissions` (布尔值, 默认: false): 授予所有权限 (-g)

5. `uninstall-apk`
   - 卸载应用程序
   - 必需参数：
     - `packageName` (字符串): 要卸载的包名
   - 可选参数：
     - `keepData` (布尔值, 默认: false): 保留应用数据和缓存 (-k)

更多工具说明请参考下方英文文档。

## 设置说明

1. 安装 ADB:

   - 下载 Android SDK Platform Tools
   - 将 ADB 添加到系统环境变量
   - 使用 `adb version` 验证安装

2. 启用 USB 调试:
   - 在 Android 设备上，进入设置 > 关于手机
   - 点击版本号 7 次以启用开发者选项
   - 在开发者选项中启用 USB 调试

### 安装服务器

```shell
# 克隆仓库
git clone [repository-url]
cd mcp-server-adb

# 安装依赖
npm install

# 构建项目
npm run build
```

### 在 Claude Desktop 中使用

在你的 `claude_desktop_config.json` 中添加以下内容：

```json
{
  "mcpServers": {
    "adb": {
      "command": "node",
      "args": ["-y", "/path/to/mcp-server-adb/build/index.js", "/path/to/adb"]
    }
  }
}
```

请将 /path/to/adb 替换为你实际的 ADB 可执行文件路径。

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。

---

<a name="english"></a>

# ADB MCP Server

MCP Server for Android Debug Bridge (ADB), enabling Claude to interact with Android devices.

## Tools

1. `get-devices`

   - List connected Android devices
   - Optional inputs:
     - `showDetails` (boolean, default: true): Show device details (-l)
   - Returns: List of connected devices with their details

2. `list-packages`

   - List installed packages on the device
   - Optional inputs:
     - `showPath` (boolean, default: false): Show the APK file path (-f)
     - `showDisabled` (boolean, default: false): Show only disabled packages (-d)
     - `showEnabled` (boolean, default: false): Show only enabled packages (-e)
     - `showSystem` (boolean, default: false): Show only system packages (-s)
     - `showThirdParty` (boolean, default: false): Show only third party packages (-3)
     - `showInstaller` (boolean, default: false): Show package installer (-i)
     - `includeUninstalled` (boolean, default: false): Include uninstalled packages (-u)
   - Returns: List of packages based on specified filters

3. `input-text`

   - Input text to the device
   - Required inputs:
     - `text` (string): Text to input
   - Returns: Text input confirmation

4. `install-apk`

   - Install an APK file to the device
   - Required inputs:
     - `apkPath` (string): Path to the APK file
   - Optional inputs:
     - `allowReinstall` (boolean, default: true): Allow reinstalling (-r)
     - `allowTestPackages` (boolean, default: true): Allow test packages (-t)
     - `allowDowngrade` (boolean, default: true): Allow downgrade (-d)
     - `grantPermissions` (boolean, default: false): Grant all permissions (-g)
   - Returns: Installation result

5. `uninstall-apk`

   - Uninstall an application
   - Required inputs:
     - `packageName` (string): Package name to uninstall
   - Optional inputs:
     - `keepData` (boolean, default: false): Keep app data and cache (-k)
   - Returns: Uninstallation result

6. `clear-app-data`

   - Clear application data
   - Required inputs:
     - `packageName` (string): Package name to clear data
   - Returns: Operation result

7. `pull`

   - Pull a file from device
   - Required inputs:
     - `remotePath` (string): Path to file on device
   - Optional inputs:
     - `localPath` (string): Local destination path
   - Returns: File transfer result

8. `push`

   - Push a file to device
   - Required inputs:
     - `localPath` (string): Path to local file
     - `remotePath` (string): Destination path on device
   - Returns: File transfer result

9. `screencap`

   - Take a screenshot
   - Required inputs:
     - `remotePath` (string): Path on device where to save the screenshot (e.g., /sdcard/screenshot.png)
   - Optional inputs:
     - `usePng` (boolean, default: true): Save as PNG (-p)
   - Returns: Screenshot capture result

10. `rm`

    - Remove a file from the Android device
    - Required inputs:
      - `path` (string): Path to the file on device to remove
    - Optional inputs:
      - `force` (boolean, default: false): Force removal (-f)
      - `recursive` (boolean, default: false): Recursive removal (-r)
    - Returns: File removal result

11. `reset-permissions`

    - Reset all permissions for an app
    - Required inputs:
      - `packageName` (string): Target package name
    - Returns: Permission reset result

12. `grant-permission`

    - Grant a specific permission
    - Required inputs:
      - `packageName` (string): Target package name
      - `permission` (string): Permission to grant
    - Returns: Permission grant result

13. `revoke-permission`

    - Revoke a specific permission
    - Required inputs:
      - `packageName` (string): Target package name
      - `permission` (string): Permission to revoke
    - Returns: Permission revocation result

14. `start-activity`

    - Start an activity using am start
    - Optional inputs:
      - `component` (string): Component name
      - `action` (string): Intent action
      - `data` (string): Intent data URI
      - `mimeType` (string): MIME type
      - `category` (string[]): Intent categories
      - `extras` (array): Intent extras
      - `flags` (string[]): Intent flags
      - `waitForLaunch` (boolean, default: false): Wait for launch (-W)
      - `debuggable` (boolean, default: false): Debug mode (-D)
      - `stopApp` (boolean, default: false): Force stop app (-S)
    - Returns: Activity start result

15. `kill-server`

    - Kill the ADB server process
    - No inputs required
    - Returns: Success message or error

16. `start-server`

    - Start the ADB server process
    - No inputs required
    - Returns: Success message or error

17. `help`
    - Show ADB help information
    - No inputs required
    - Returns: ADB help text

All tools support these device selection parameters:

- `deviceId` (string, optional): Target specific device by ID
- `useUsb` (boolean, default: false): Target USB device (-d)
- `useEmulator` (boolean, default: false): Target emulator (-e)

## Setup

1. Install ADB:

   - Download Android SDK Platform Tools
   - Add ADB to your system PATH
   - Verify installation with `adb version`

2. Enable USB Debugging:
   - On Android device, go to Settings > About phone
   - Tap Build number 7 times to enable Developer options
   - Enable USB debugging in Developer options

### Install the Server

```:shell
# Clone the repository
git clone [repository-url]
cd mcp-server-adb

# Install dependencies
npm install

# Build the project
npm run build
```

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```:json
{
  "mcpServers": {
    "adb": {
      "command": "node",
      "args": [
        "-y",
        "/path/to/mcp-server-adb/build/index.js",
        "/path/to/adb"
      ]
    }
  }
}
```

Replace /path/to/adb with the actual path to your ADB executable.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
