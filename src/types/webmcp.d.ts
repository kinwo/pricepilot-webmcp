type WebMCPToolAnnotations = {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
};

type WebMCPExecuteOptions = { signal: AbortSignal };

type WebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: WebMCPToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    options: WebMCPExecuteOptions
  ) => Promise<unknown>;
};

interface Document {
  modelContext?: {
    registerTool: (
      tool: WebMCPTool,
      options?: { signal?: AbortSignal; exposedTo?: string[] }
    ) => Promise<void>;
    getTools?: () => Promise<Array<{ name: string }>>;
  };
}

