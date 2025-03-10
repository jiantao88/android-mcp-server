import {exec} from 'child_process';
import {promisify} from 'util';
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {z} from 'zod';

const execAsync = promisify(exec);
const server = new McpServer({
  name: 'adb-tools',
  version: '1.0.0'
});

// Command line argument parsing
if (process.argv.length < 3) {
  console.error('Usage: mcp-server-adb <path for adb>');
  process.exit(1);
}
const adbPath = process.argv[2];

// Function to execute ADB commands
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

    const {stdout, stderr} = await execAsync(`${adbPath} ${deviceOption} ${command}`);
    if (stderr) {
      throw new Error(stderr);
    }
    return stdout;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`ADB Command Error: ${error.message}, ${error.name} ${error.stack}`);
    }
    throw new Error('Unknown error occurred while executing ADB command');
  }
}

// Tool to get list of connected devices
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

// Update the device selection parameters for all tools
const deviceSelectionParams = {
  deviceId: z.string().optional().describe('Target specific device by ID (takes precedence over useUsb and useEmulator)'),
  useUsb: z.boolean().optional().default(false).describe('Target USB connected device (-d)'),
  useEmulator: z.boolean().optional().default(false).describe('Target emulator instance (-e)')
};

// Tool to get list of installed packages
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

// Tool for text input
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

// Tool to show ADB help
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

// Tool to kill ADB server
server.tool(
  'kill-server',
  'Kill the ADB server process',
  async () => {
    try {
      await executeAdbCommand('kill-server');
      return {
        content: [{type: 'text', text: 'ADB server has been killed successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to kill ADB server: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to start ADB server
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

// Tool to install APK
server.tool(
  'install-apk',
  'Install an APK file to the device',
  {
    ...deviceSelectionParams,
    apkPath: z.string().describe('Path to the APK file'),
    allowReinstall: z.boolean().optional().default(true).describe('Allow reinstalling an existing app (-r)'),
    allowTestPackages: z.boolean().optional().default(true).describe('Allow test packages (-t)'),
    allowDowngrade: z.boolean().optional().default(true).describe('Allow version code downgrade (-d)'),
    grantPermissions: z.boolean().optional().default(false).describe('Grant all permissions (-g)')
  },
  async ({ apkPath, deviceId, useUsb, useEmulator, allowReinstall, allowTestPackages, allowDowngrade, grantPermissions }) => {
    try {
      const options = [
        allowReinstall ? '-r' : '',
        allowTestPackages ? '-t' : '',
        allowDowngrade ? '-d' : '',
        grantPermissions ? '-g' : '',
      ].filter(Boolean).join(' ');

      const result = await executeAdbCommand(`install ${options} "${apkPath}"`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to install APK: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to uninstall package
server.tool(
  'uninstall-apk',
  'Uninstall an application from the device',
  {
    ...deviceSelectionParams,
    packageName: z.string().describe('Package name of the application'),
    keepData: z.boolean().optional().default(false).describe('Keep the app data and cache directories (-k)')
  },
  async ({ packageName, keepData, deviceId, useUsb, useEmulator }) => {
    try {
      const options = keepData ? '-k' : '';
      const result = await executeAdbCommand(`uninstall ${options} ${packageName}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || 'Package uninstalled successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to uninstall package: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to clear app data
server.tool(
  'clear-app-data',
  'Clear application data for a specific package',
  {
    ...deviceSelectionParams,
    packageName: z.string().describe('Package name of the application')
  },
  async ({ packageName, deviceId, useUsb, useEmulator }) => {
    try {
      const result = await executeAdbCommand(`shell pm clear ${packageName}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || 'Application data cleared successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to clear application data: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to pull file from device
server.tool(
  'pull',
  'Pull a file from the Android device to the local machine',
  {
    ...deviceSelectionParams,
    remotePath: z.string().describe('Path to the file on the device'),
    localPath: z.string().optional().describe('Path where to save the file locally (optional, defaults to current directory)')
  },
  async ({ remotePath, localPath, deviceId, useUsb, useEmulator }) => {
    try {
      const pullCommand = localPath
        ? `pull "${remotePath}" "${localPath}"`
        : `pull "${remotePath}"`;

      const result = await executeAdbCommand(pullCommand, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to pull file: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to push file to device
server.tool(
  'push',
  'Push a file from the local machine to the Android device',
  {
    ...deviceSelectionParams,
    localPath: z.string().describe('Path to the local file'),
    remotePath: z.string().describe('Destination path on the device')
  },
  async ({ localPath, remotePath, deviceId, useUsb, useEmulator }) => {
    try {
      const result = await executeAdbCommand(`push "${localPath}" "${remotePath}"`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to push file: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to capture screen
server.tool(
  'screencap',
  'Take a screenshot of the device display',
  {
    ...deviceSelectionParams,
    remotePath: z.string().describe('Path on device where to save the screenshot (e.g., /sdcard/screenshot.png)'),
    usePng: z.boolean().optional().default(true).describe('Save as PNG format (-p)')
  },
  async ({ remotePath, usePng, deviceId, useUsb, useEmulator }) => {
    try {
      const options = usePng ? '-p' : '';
      const result = await executeAdbCommand(`shell screencap ${options} ${remotePath}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || 'Screenshot captured successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to remove file from device
server.tool(
  'rm',
  'Remove a file from the Android device',
  {
    ...deviceSelectionParams,
    path: z.string().describe('Path to the file on device to remove'),
    force: z.boolean().optional().default(false).describe('Force removal (-f)'),
    recursive: z.boolean().optional().default(false).describe('Recursive removal (-r)')
  },
  async ({ path, force, recursive, deviceId, useUsb, useEmulator }) => {
    try {
      const options = [
        force ? '-f' : '',
        recursive ? '-r' : ''
      ].filter(Boolean).join(' ');

      const result = await executeAdbCommand(`shell rm ${options} ${path}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || 'File removed successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to remove file: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to reset app permissions
server.tool(
  'reset-permissions',
  'Reset all permissions for a specific package',
  {
    ...deviceSelectionParams,
    packageName: z.string().describe('Package name of the application')
  },
  async ({ packageName, deviceId, useUsb, useEmulator }) => {
    try {
      const result = await executeAdbCommand(`shell pm reset-permissions -p ${packageName}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || 'Permissions reset successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to reset permissions: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to grant a permission
server.tool(
  'grant-permission',
  'Grant a specific permission to an app',
  {
    ...deviceSelectionParams,
    packageName: z.string().describe('Package name of the application'),
    permission: z.string().describe('Permission to grant (e.g., android.permission.CAMERA)')
  },
  async ({ packageName, permission, deviceId, useUsb, useEmulator }) => {
    try {
      const result = await executeAdbCommand(`shell pm grant ${packageName} ${permission}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || `Permission ${permission} granted successfully to ${packageName}`}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to grant permission: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to revoke a permission
server.tool(
  'revoke-permission',
  'Revoke a specific permission from an app',
  {
    ...deviceSelectionParams,
    packageName: z.string().describe('Package name of the application'),
    permission: z.string().describe('Permission to revoke (e.g., android.permission.CAMERA)')
  },
  async ({ packageName, permission, deviceId, useUsb, useEmulator }) => {
    try {
      const result = await executeAdbCommand(`shell pm revoke ${packageName} ${permission}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || `Permission ${permission} revoked successfully from ${packageName}`}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to revoke permission: ${error instanceof Error ? error.message : 'Unknown error'}`}]
      };
    }
  }
);

// Tool to start an activity
server.tool(
  'start-activity',
  'Start an activity using activity manager (am start)',
  {
    ...deviceSelectionParams,
    component: z.string().optional().describe('Component name (e.g., com.example/.MainActivity or com.example/com.example.MainActivity)'),
    action: z.string().optional().describe('Intent action (e.g., android.intent.action.VIEW)'),
    data: z.string().optional().describe('Intent data URI'),
    mimeType: z.string().optional().describe('MIME type (e.g., image/png)'),
    category: z.array(z.string()).optional().describe('Intent categories (e.g., ["android.intent.category.LAUNCHER"])'),
    extras: z.array(z.object({
      type: z.enum(['string', 'int', 'long', 'float', 'boolean', 'uri', 'component']),
      key: z.string(),
      value: z.string()
    })).optional().describe('Intent extras (e.g., [{type: "string", key: "key1", value: "value1"}])'),
    flags: z.array(z.string()).optional().describe('Intent flags (e.g., ["activity_new_task", "activity_clear_top"])'),
    waitForLaunch: z.boolean().optional().default(false).describe('Wait for launch to complete (-W)'),
    debuggable: z.boolean().optional().default(false).describe('Debug mode (-D)'),
    stopApp: z.boolean().optional().default(false).describe('Force stop target app before starting activity (-S)')
  },
  async ({
    component,
    action,
    data,
    mimeType,
    category,
    extras,
    flags,
    waitForLaunch,
    debuggable,
    stopApp,
    deviceId,
    useUsb,
    useEmulator
  }) => {
    try {
      if (!component && !action) {
        throw new Error('Either component or action must be specified');
      }

      const parts = ['am start'];

      // Add basic options
      if (waitForLaunch) parts.push('-W');
      if (debuggable) parts.push('-D');
      if (stopApp) parts.push('-S');

      // Add action
      if (action) parts.push('-a', action);

      // Add data
      if (data) parts.push('-d', `"${data}"`);

      // Add MIME type
      if (mimeType) parts.push('-t', mimeType);

      // Add categories
      if (category) {
        category.forEach(cat => parts.push('-c', cat));
      }

      // Add flags
      if (flags) {
        flags.forEach(flag => parts.push('-f', flag));
      }

      // Add extras
      if (extras) {
        extras.forEach(extra => {
          const typeFlag = {
            'string': '--es',
            'int': '--ei',
            'long': '--el',
            'float': '--ef',
            'boolean': '--ez',
            'uri': '--eu',
            'component': '--ecn'
          }[extra.type];
          parts.push(typeFlag, extra.key, `"${extra.value}"`);
        });
      }

      // Add component name (if specified)
      if (component) {
        parts.push(component);
      }

      const result = await executeAdbCommand(`shell ${parts.join(' ')}`, { deviceId, useUsb, useEmulator });
      return {
        content: [{type: 'text', text: result || 'Activity started successfully'}]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{type: 'text', text: `Failed to start activity: ${error instanceof Error ? error.message : 'Unknown error'}`}]
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
