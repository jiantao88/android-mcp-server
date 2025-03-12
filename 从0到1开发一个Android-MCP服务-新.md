# 从 0 到 1 开发一个 Android MCP 服务：深入理解 MCP 协议与 ADB 集成

## 引言

随着大模型技术的发展，AI 辅助编程已经成为开发者的重要工具。Claude Desktop 作为一款强大的 AI 编程助手，通过 MCP（Model Context Protocol）协议可以扩展其功能，使其能够与各种外部工具进行交互。本文将深入探讨 MCP 协议的工作原理，并以 Android 设备交互为例，详细介绍如何开发一个 MCP 服务，使 Claude Desktop 能够直接与 Android 设备通信。

## MCP 协议原理

### 什么是 MCP 协议？

MCP（Model Context Protocol）是一种设计用于 AI 模型与外部工具交互的协议。它定义了一套标准化的消息格式和通信机制，使 AI 模型能够调用外部工具执行特定任务，并将结果返回给模型。在 Claude Desktop 中，MCP 协议是连接 AI 助手与外部世界的桥梁。

### MCP 协议的核心组件

1. **MCP 服务器**：实现 MCP 协议的服务端，负责接收来自 Claude Desktop 的请求并执行相应的工具函数
2. **传输层**：负责在 Claude Desktop 和 MCP 服务器之间传递消息，常见的实现是`StdioServerTransport`，它使用标准输入/输出流进行通信
3. **工具定义**：MCP 服务器定义的各种工具函数，每个工具都有名称、描述、参数定义和执行逻辑
4. **消息格式**：基于 JSON 的消息格式，包含请求和响应两种类型

### MCP 通信流程

MCP 协议的通信流程如下：

1. **初始化**：MCP 服务器启动并创建传输层实例
2. **连接**：MCP 服务器与传输层连接，准备接收请求
3. **请求**：Claude Desktop 发送工具调用请求，包含工具名称和参数
4. **处理**：MCP 服务器接收请求，找到对应的工具函数并执行
5. **响应**：MCP 服务器将执行结果通过传输层返回给 Claude Desktop
6. **显示**：Claude Desktop 接收结果并在界面上显示

## 从零开始构建 Android MCP 服务

接下来，我们将详细介绍如何构建一个 Android MCP 服务，重点关注 MCP 连接的实现原理，以及如何通过 MCP 协议与 ADB 进行交互。

### 项目初始化

首先，我们需要创建一个新的项目，并安装必要的依赖：

```bash
mkdir android-mcp-server
cd android-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod typescript @types/node
npm install --save-dev ts-node
```

### MCP 服务器的核心实现

MCP 服务器的核心实现包括服务器创建、传输层连接和工具定义。以下是一个简化的示例：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 创建MCP服务器
const server = new McpServer({
  name: "adb-mcp-tools",
  version: "1.0.0",
});

// 主函数：创建传输层并连接
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ADB MCP Server running on stdio");
}

// 启动服务器
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

这段代码是 MCP 服务器的核心。让我们深入分析其中的关键部分：

1. **创建 MCP 服务器**：使用`McpServer`类创建一个 MCP 服务器实例，指定服务器的名称和版本
2. **创建传输层**：在`main`函数中，创建一个`StdioServerTransport`实例，它使用标准输入/输出流作为通信通道
3. **连接服务器与传输层**：调用`server.connect(transport)`将 MCP 服务器与传输层连接起来
4. **启动服务器**：调用`main`函数启动服务器，并处理可能出现的错误

### 深入理解 MCP 工具实现：以 get-devices 为例

现在，让我们深入分析`get-devices`工具的实现，这个工具用于获取连接的 Android 设备列表。

```typescript
// 定义get-devices工具
server.tool(
  "get-devices",
  "Get a list of connected Android devices",
  {
    showDetails: z
      .boolean()
      .optional()
      .default(true)
      .describe("Show device details (-l)"),
  },
  async ({ showDetails }) => {
    try {
      const options = showDetails ? "-l" : "";
      const result = await executeAdbCommand(`devices ${options}`);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to get device list: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
      };
    }
  }
);
```

这个工具的实现包含四个关键部分：

1. **工具名称**：`'get-devices'`，这是 Claude Desktop 用来调用这个工具的标识符
2. **工具描述**：提供了对工具功能的简短描述
3. **参数定义**：使用`zod`库定义参数模式，这里定义了一个可选的布尔参数`showDetails`
4. **执行函数**：一个异步函数，接收参数对象，执行工具逻辑，并返回结果

Claude Desktop`get-devices`工具时，MCP 协议的工作流程如下：

1. **Claude Desktop 发送请求**：Claude Desktop 通过标准输入流发送一个 JSON 请求，例如：

   ```json
   {
     "id": "req-1",
     "method": "tool",
     "params": {
       "name": "get-devices",
       "params": {
         "showDetails": true
       }
     }
   }
   ```

2. **MCP 服务器接收请求**：`StdioServerTransport`从标准输入流读取请求，并传递给 MCP 服务器

3. **MCP 服务器处理请求**：

   - 解析请求，提取工具名称和参数
   - 找到名为`get-devices`的工具定义
   - 验证参数是否符合定义的模式
   - 调用工具的执行函数，传入参数

4. **执行 ADB 命令**：工具执行函数调用`executeAdbCommand`函数执行 ADB 命令：

   ```typescript
   const result = await executeAdbCommand(`devices -l`);
   ```

5. **返回结果**：工具执行函数将结果包装成 MCP 响应格式：

   ```typescript
   return {
     content: [{ type: "text", text: result }],
   };
   ```

6. **MCP 服务器发送响应**：MCP 服务器将响应通过`StdioServerTransport`写入标准输出流：

   ```json
   {
     "id": "req-1",
     "result": {
       "content": [
         {
           "type": "text",
           "text": "List of devices attached\nemulator-5554 device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:2\n"
         }
       ]
     }
   }
   ```

7. **Claude Desktop 接收响应**：Claude Desktop 从标准输出流读取响应，解析并显示结果

这个过程展示了 MCP 协议如何实现 Claude Desktop 与外部工具的无缝集成。通过标准化的请求-响应模式，Claude Desktop 能够调用外部工具执行各种任务，并将结果整合到用户界面中。

### 实现崩溃日志分析功能

接下来，让我们深入分析崩溃日志分析功能的实现，这是一个更复杂的 MCP 工具示例。

首先，我们定义一个获取应用崩溃日志的辅助函数：

```typescript
// 获取应用崩溃日志的函数
async function getAppCrashLog(
  packageName: string,
  options?: {
    deviceId?: string;
    useUsb?: boolean;
    useEmulator?: boolean;
    lines?: number;
  }
): Promise<string> {
  try {
    const lines = options?.lines || 200;
    // 使用logcat获取指定包名的崩溃日志
    const logcatCommand = `logcat -b crash -d -v threadtime *:E | grep -i "${packageName}" | tail -n ${lines}`;
    const result = await executeAdbCommand(`shell ${logcatCommand}`, {
      deviceId: options?.deviceId,
      useUsb: options?.useUsb,
      useEmulator: options?.useEmulator,
    });
    return result || "未找到相关崩溃日志";
  } catch (error) {
    return `获取崩溃日志失败: ${
      error instanceof Error ? error.message : "未知错误"
    }`;
  }
}
```

然后，我们定义崩溃日志分析工具：

```typescript
// 获取应用崩溃日志工具
server.tool(
  "get-crash-log",
  "获取应用崩溃日志，分析错误原因",
  {
    ...deviceSelectionParams,
    packageName: z.string().describe("应用包名"),
    lines: z.number().optional().default(200).describe("获取日志的行数"),
  },
  async ({ packageName, lines, deviceId, useUsb, useEmulator }) => {
    try {
      // 获取崩溃日志
      const crashLog = await getAppCrashLog(packageName, {
        deviceId,
        useUsb,
        useEmulator,
        lines,
      });

      if (!crashLog || crashLog === "未找到相关崩溃日志") {
        return {
          content: [
            {
              type: "text",
              text: "未找到相关崩溃日志，请确认应用是否发生过崩溃或包名是否正确",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `应用 ${packageName} 的崩溃日志：\n\n${crashLog}\n\n请在Claude Desktop中分析该崩溃日志的原因。`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `获取崩溃日志失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`,
          },
        ],
      };
    }
  }
);
```

这个工具的实现比`get-devices`更复杂，但基本原理是相同的。Claude Desktop`get-crash-log`工具时，MCP 协议的工作流程如下：

1. **Claude Desktop 发送请求**：包含工具名称和参数（包名、行数等）
2. **MCP 服务器处理请求**：验证参数并调用工具执行函数
3. **执行函数处理逻辑**：
   - 调用`getAppCrashLog`函数获取崩溃日志
   - 检查日志是否为空
   - 格式化日志并返回结果
4. **MCP 服务器发送响应**：将结果通过传输层返回给 Claude Desktop
5. **Claude Desktop 显示结果**：在界面上显示崩溃日志，并可能进一步分析日志内容

这个工具的特别之处在于它不仅执行了 ADB 命令，还对结果进行了处理和格式化，使其更适合在 Claude Desktop 中显示和分析。这展示了 MCP 工具的灵活性，它们可以从简单的命令执行到复杂的数据处理和分析。

## MCP 服务的高级特性

除了基本的工具实现，MCP 服务还支持许多高级特性，使其更加强大和灵活。

### 参数验证与类型安全

MCP 服务使用`zod`库进行参数验证，这提供了强大的类型安全保障。例如：

```typescript
// 设备选择参数
const deviceSelectionParams = {
  deviceId: z
    .string()
    .optional()
    .describe(
      "Target specific device by ID (takes precedence over useUsb and useEmulator)"
    ),
  useUsb: z
    .boolean()
    .optional()
    .default(false)
    .describe("Target USB connected device (-d)"),
  useEmulator: z
    .boolean()
    .optional()
    .default(false)
    .describe("Target emulator instance (-e)"),
};
```

这个定义不仅描述了参数的结构，还提供了默认值和描述信息，使 Claude Desktop 能够生成更好的用户界面和提示。

### 错误处理与恢复

MCP 工具实现中的错误处理是一个重要方面。每个工具都应该捕获可能的错误，并返回有意义的错误消息：

```typescript
try {
  // 工具逻辑
  return { content: [{ type: "text", text: result }] };
} catch (error) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
    ],
  };
}
```

这确保了即使在出现错误的情况下，Claude Desktop 也能收到有用的反馈，而不是简单地失败。

### 复杂内容类型

MCP 协议支持多种内容类型，不仅限于文本。例如，我们可以返回图像、表格或其他结构化数据：

```typescript
return {
  content: [
    { type: "text", text: "Device screenshot:" },
    { type: "image", data: base64EncodedImage, mimeType: "image/png" },
  ],
};
```

这使得 MCP 工具能够提供丰富的交互体验，而不仅仅是文本输出。

## 在 Claude Desktop 中集成 MCP 服务

要在 Claude Desktop 中集成我们开发的 Android MCP 服务，需要进行以下配置：

1. **构建项目**：

   ```bash
   npm run build
   ```

2. **配置 Claude Desktop**：

   - 打开 Claude Desktop 应用
   - 进入设置界面，找到「扩展工具」或「MCP 工具」选项
   - 点击「添加新工具」，选择「自定义 MCP 服务」
   - 填写以下信息：
     - 工具名称：Android ADB 工具
     - 命令路径：指向你的 MCP 服务可执行文件的完整路径
     - 工作目录：MCP 服务的根目录
     - 启动参数：如果需要，添加任何额外的命令行参数

3. **使用 MCP 工具**：

   - 成功配置后，在与 Claude 对话时，可以直接要求它使用 Android 设备工具，例如：
     ```
     请列出当前连接的 Android 设备
     ```
     或
     ```
     请获取应用 com.example.app 的崩溃日志
     ```
   - Claude 会自动调用相应的 MCP 工具并展示结果

4. **故障排除**：
   - 如果工具无法正常工作，检查 Claude Desktop 的日志文件
   - 确保 ADB 命令在系统路径中可用
   - 验证 Android 设备已正确连接并启用了 USB 调试

## 在 Windsurf 中使用 MCP 服务

要在 Windsurf 中使用我们开发的 MCP 服务，需要进行以下配置：

1. **构建项目**：

   ```bash
   npm run build
   ```

2. **配置 Windsurf**：

   - 打开 Windsurf 设置
   - 进入 MCP 配置部分
   - 添加新的 MCP 服务，指定命令和工作目录

3. **使用 MCP 工具**：
   - 在 Windsurf 中，可以直接调用我们定义的工具，例如：
     ```
     get-devices
     get-crash-log --packageName com.example.app
     ```

## 总结与展望

本文深入探讨了 MCP 协议的工作原理，并以 Android 设备交互为例，详细介绍了如何开发一个 MCP 服务。通过这个例子，我们看到了 MCP 协议如何实现 AI 模型与外部工具的无缝集成，使 Claude Desktop 能够执行各种复杂任务。

MCP 协议的设计理念是简单而强大的：通过标准化的消息格式和通信机制，使 AI 模型能够与外部世界交互。这种设计不仅适用于 Android 设备交互，还可以扩展到各种其他领域，如 Web 服务、数据库操作、文件系统管理等。

未来，随着 AI 技术的发展，MCP 协议将发挥越来越重要的作用，使 AI 模型能够更好地理解和操作现实世界。开发者可以创建各种 MCP 服务，扩展 AI 模型的能力，使其成为更加强大的工具。

## 参考资料

1. [Model Context Protocol 文档](https://modelcontextprotocol.github.io/)
2. [Android Debug Bridge (ADB) 文档](https://developer.android.com/studio/command-line/adb)
3. [Node.js 文档](https://nodejs.org/docs/latest/api/)
4. [TypeScript 文档](https://www.typescriptlang.org/docs/)

## 项目地址

本文介绍的 Android MCP 服务完整代码已开源，欢迎访问以下地址获取源码和更多信息：

- GitHub: [https://github.com/jiantao88/android-mcp-server](https://github.com/jiantao88/android-mcp-server)
