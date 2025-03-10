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

6. `clear-app-data`

   - 清除应用程序数据
   - 必需参数：
     - `packageName` (字符串): 要清除数据的包名

7. `pull`

   - 从设备拉取文件
   - 必需参数：
     - `remotePath` (字符串): 设备上的文件路径
   - 可选参数：
     - `localPath` (字符串): 本地目标路径

8. `push`

   - 推送文件到设备
   - 必需参数：
     - `localPath` (字符串): 本地文件路径
     - `remotePath` (字符串): 设备上的目标路径

9. `screencap`

   - 截取屏幕截图
   - 必需参数：
     - `remotePath` (字符串): 在设备上保存截图的路径（例如：/sdcard/screenshot.png）
   - 可选参数：
     - `usePng` (布尔值, 默认: true): 保存为 PNG 格式 (-p)

10. `rm`

    - 从 Android 设备删除文件
    - 必需参数：
      - `path` (字符串): 要删除的设备上的文件路径
    - 可选参数：
      - `force` (布尔值, 默认: false): 强制删除 (-f)
      - `recursive` (布尔值, 默认: false): 递归删除 (-r)

11. `reset-permissions`

    - 重置应用的所有权限
    - 必需参数：
      - `packageName` (字符串): 目标包名

12. `grant-permission`
    - 授予特定权限
    - 必需参数：
      - `packageName` (字符串): 目标包名
      - `permission` (字符串): 要授予的权限

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

### 在 Windsurf 中使用

1. 首先确保已经安装了 Node.js 和 ADB

2. 克隆并构建项目：
   ```shell
   git clone https://github.com/jiantao88/android-mcp-server.git
   cd android-mcp-server
   npm install
   npm run build
   ```

   或者直接使用已经克隆的项目：
   ```shell
   cd /Users/zhangjiantao/Documents/GitHub/android-mcp-server
   npm install
   npm run build
   ```

3. 在 Windsurf 的设置中添加 MCP 配置：
   ```json
   {
     "mcpServers": {
       "adb": {
         "command": "node",
         "args": [
           "/Users/zhangjiantao/Documents/GitHub/android-mcp-server/build/index.js",
           "/usr/local/bin/adb"
         ]
       }
     }
   }
   ```

   注意：
   - 将路径中的路径替换为你的实际路径
   - `/usr/local/bin/adb` 是 ADB 的默认安装路径，如果你的 ADB 安装在其他位置，请相应修改
   - 确保所有路径都使用绝对路径

4. 重启 Windsurf 使配置生效

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。
