import {exec} from 'child_process';
import {promisify} from 'util';
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {z} from 'zod';

const execAsync = promisify(exec);
const server = new McpServer({
  name: 'adb-mcp-tools',
  version: '1.0.0'
});

// 命令行参数解析
if (process.argv.length < 3) {
  console.error('Usage: mcp-server-adb <path for adb>');
  process.exit(1);
}
const adbPath = process.argv[2];

// 执行ADB命令的函数
async function executeAdbCommand(command: string, options?: { deviceId?: string, useUsb?: boolean, useEmulator?: boolean }): Promise<string> {
  try {
    let deviceOption = '';
    if (options?.deviceId) {
      deviceOption = `-s ${options.deviceId}`;
    } else if (options?.useUsb) {
      deviceOption = '-d';
    } else if (options?.useEmulator) {
      deviceOption = '-e';
    }

    // 使用完整路径执行命令
    const cmd = `"${adbPath}" ${deviceOption} ${command}`;
    console.log('Executing command:', cmd);
    const {stdout, stderr} = await execAsync(cmd);
    
    // 某些 adb 命令会输出到 stderr，但不一定是错误
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    return stdout || stderr;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`ADB Command Error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while executing ADB command');
  }
}

// 获取已连接设备列表的工具
server.tool(
  'get-devices',
  'Get a list of connected Android devices',
  {
    showDetails: z.boolean().optional().default(true).describe('Show device details (-l)')
  },
  async ({ showDetails }) => {
    try {
      const options = showDetails ? '-l' : '';
      const result = await executeAdbCommand(`devices ${options}`);
      return {
        content: [{type: 'text', text: result}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to get device list: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// 更新所有工具的设备选择参数
const deviceSelectionParams = {
  deviceId: z.string().optional().describe('Target specific device by ID (takes precedence over useUsb and useEmulator)'),
  useUsb: z.boolean().optional().default(false).describe('Target USB connected device (-d)'),
  useEmulator: z.boolean().optional().default(false).describe('Target emulator instance (-e)')
};

// 获取已安装应用列表的工具
server.tool(
  'list-packages',
  'Get a list of installed applications',
  {
    ...deviceSelectionParams,
    showPath: z.boolean().optional().default(false).describe('Show the APK file path for each package (-f)'),
    showDisabled: z.boolean().optional().default(false).describe('Filter to only show disabled packages (-d)'),
    showEnabled: z.boolean().optional().default(false).describe('Filter to only show enabled packages (-e)'),
    showSystem: z.boolean().optional().default(false).describe('Filter to only show system packages (-s)'),
    showThirdParty: z.boolean().optional().default(false).describe('Filter to only show third party packages (-3)'),
    showInstaller: z.boolean().optional().default(false).describe('Show the installer for each package (-i)'),
    includeUninstalled: z.boolean().optional().default(false).describe('Include uninstalled packages (-u)')
  },
  async ({ deviceId, useUsb, useEmulator, showPath, showDisabled, showEnabled, showSystem, showThirdParty, showInstaller, includeUninstalled }) => {
    try {
      const options = [
        showPath ? '-f' : '',
        showDisabled ? '-d' : '',
        showEnabled ? '-e' : '',
        showSystem ? '-s' : '',
        showThirdParty ? '-3' : '',
        showInstaller ? '-i' : '',
        includeUninstalled ? '-u' : ''
      ].filter(Boolean).join(' ');

      const result = await executeAdbCommand(`shell pm list packages ${options}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to get package list: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// 文本输入工具
server.tool(
  'input-text',
  'Input text to the connected Android device',
  {
    ...deviceSelectionParams,
    text: z.string().describe('Text to input to the device')
  },
  async ({ text, deviceId, useUsb, useEmulator }) => {
    try {
      const escapedText = `'${text}'`;
      const result = await executeAdbCommand(`shell input text ${escapedText}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: 'Text input completed successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to input text: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// 显示ADB帮助信息的工具
server.tool(
  'help',
  'Show ADB help information',
  async () => {
    try {
      const result = await executeAdbCommand('help');
      return {
        content: [{type: 'text', text: result}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to get ADB help: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// 终止ADB服务器的工具
server.tool(
  'kill-server',
  'Kill the ADB server process',
  async () => {
    try {
      await executeAdbCommand('kill-server');
      return {
        content: [{type: 'text', text: 'ADB server terminated successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to kill ADB server: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// 启动ADB服务器的工具
server.tool(
  'start-server',
  'Start the ADB server process',
  async () => {
    try {
      await executeAdbCommand('start-server');
      return {
        content: [{type: 'text', text: 'ADB server has been started successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to start ADB server: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ADB MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
