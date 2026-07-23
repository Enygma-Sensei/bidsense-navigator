

--- FILE SPLIT: 01_introduction_and_foundations.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## CHAPTER 01: INTRODUCTION, FOUNDATIONS, & ARCHITECTURAL PRINCIPLES

---

## 1. WHAT IS THE VERCEL AI SDK?
The Vercel AI SDK is a unified, type-safe TypeScript toolkit designed to help developers build AI-powered applications, multi-step agents, and rich streaming interfaces. It decouples application code from underlying model provider APIs, allowing developers to switch models or providers with single-line configuration changes.

### 1.1 The Core Design Philosophies
- **Type-Safety by Design:** Full TypeScript support with compile-time type-safety, specifically leveraging Zod schemas for structured object generations and tool inputs.
- **Provider Agnosticism:** Standardized model interfaces allow unified code paths to execute across OpenAI, Anthropic Claude, Google Gemini, local models, and more.
- **Client-Side/Edge Compatibility:** Lightweight, optimized for serverless, edge functions, and client-side browser runtimes, avoiding bulky runtime overhead.
- **Multi-Step Autonomy (Agentic):** Native support for recursive tool-calling loops, context-aware state management, and human-in-the-loop approvals.

---

## 2. THE THREE CORE PACKAGES

```
                     VERCEL AI SDK ARCHITECTURAL LAYERS
  
    ┌─────────────────────────────────────────────────────────────────┐
    │                       AI SDK UI (@ai-sdk/react)                 │
    │  - Hooks for real-time state tracking (useChat, useAssistant)   │
    │  - Framework integrations (React, Next.js, Vue, Svelte, Solid)  │
    └────────────────────────────────┬────────────────────────────────┘
                                     │ (Streams raw events / envelopes)
                                     ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                         AI SDK Core (ai)                        │
    │  - Unified execution APIs (generateText, ToolLoopAgent, embed) │
    │  - Type-safe tool definitions & execution loops                 │
    └────────────────────────────────┬────────────────────────────────┘
                                     │ (Standardized Provider Protocol)
                                     ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      AI SDK Providers (@ai-sdk/*)               │
    │  - Model adapters wrapping raw HTTP endpoints (OpenAI, Claude)   │
    │  - Standardized LanguageModelV1 / EmbeddingModelV1 interfaces    │
    └─────────────────────────────────────────────────────────────────┘
```

### 2.1 AI SDK Core (`ai`)
The foundational layer containing server-side and edge-compatible execution APIs:
- Standard generation functions: `generateText`, `streamText`, `generateObject`, `streamObject`.
- Vector embeddings and ranking: `embed`, `embedMany`, `rerank`.
- Media synthesis: `generateImage`, `generateSpeech`, `transcribe`.
- Agentic execution loops: `ToolLoopAgent`, `HarnessAgent`.

### 2.2 AI SDK UI (`@ai-sdk/react`, `@ai-sdk/vue`, etc.)
Framework-specific hooks that manage chat streams, input states, message history arrays, loading states, and custom server-sent data.

### 2.3 AI SDK Providers (`@ai-sdk/openai`, `@ai-sdk/anthropic`, etc.)
Granular adapter packages containing provider-specific settings, telemetry, and model definitions that implement the unified `LanguageModel` interface.

---

## 3. CORE PACKAGE INSTALLATION & DEPENDENCIES
To initialize a complete, production-ready full-stack AI project, install the required packages:

```bash
# Install core and common UI package
npm install ai @ai-sdk/react zod

# Install primary model providers
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

# Install local/community providers (optional)
npm install ollama-ai-provider @ai-sdk/cohere @ai-sdk/fireworks
```


--- FILE SPLIT: 02_ai_sdk_core_text_and_objects.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## CHAPTER 02: AI SDK CORE — TEXT GENERATION, STREAMING, & STRUCTURED OBJECTS

This chapter provides a comprehensive, exhaustive API reference for the core text and structured object generation functions, including error handling, usage details, and prompt formatting.

---

## 1. TEXT GENERATION (`generateText`)
Generates a complete, non-streaming response. Ideal for single-shot requests, automated scripts, background workers, or tasks requiring complete result objects before further execution.

### 1.1 API Reference & Configuration Parameters
```typescript
import { generateText, type Message } from 'ai';
import { openai } from '@ai-sdk/openai';

const response = await generateText({
  model: openai('gpt-4o'), // LanguageModelV1 instance
  prompt: 'Draft an absolute liability cap clause.', // Standard string prompt
  system: 'You are an expert corporate lawyer.', // Optional system instructions
  messages: [ // Alternatively, pass full message arrays for conversation state
    { role: 'user', content: 'What is G-Cloud?' },
    { role: 'assistant', content: 'G-Cloud is a UK government framework...' }
  ],
  temperature: 0.3, // 0.0 to 2.0 (creativity control)
  topP: 0.9, // Nucleus sampling threshold
  maxTokens: 500, // Hard limit on output tokens
  headers: { 'X-Custom-Billing-ID': 'bidsense_Y1' }, // Custom HTTP headers passed to provider
  abortSignal: new AbortController().signal, // Custom abort controller for cancellation
});
```

### 1.2 Output Payload Properties
- `text`: The final model-generated text string.
- `finishReason`: Why the model stopped (`'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error'`).
- `usage`: Token metrics representing billing costs:
  - `usage.promptTokens`: Input tokens.
  - `usage.completionTokens`: Output tokens.
  - `usage.totalTokens`: Total tokens.
- `steps`: Full execution logs of multi-step tool loops (if triggered).

---

## 2. TEXT STREAMING (`streamText`)
Streams text chunks to the client in real-time, reducing user-perceived latency. 

### 2.1 Implementing Real-Time Streaming
```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = await streamText({
  model: anthropic('claude-3-7-sonnet-20250219'),
  prompt: 'Write a comprehensive guide on GDPR Article 28 compliance.',
});

// Consume as an asynchronous iterable
for await (const textChunk of result.textStream) {
  process.stdout.write(textChunk);
}
```

### 2.2 Lifecycle Callbacks
- `onFirstChunk`: Triggered when the first byte of data arrives (great for measuring Time-to-First-Token).
- `onChunk`: Triggered on every individual text chunk.
- `onFinish`: Triggered when generation is completely finished, returning final text and full token usage.
```typescript
const result = await streamText({
  model: openai('gpt-4o'),
  prompt: 'Explain carbon emissions calculation.',
  onFinish: ({ text, usage, finishReason }) => {
    console.log('Stream completed. Total Tokens:', usage.totalTokens);
  }
});
```

---

## 3. STRUCTURED OBJECT GENERATION (`generateObject` & `streamObject`)
Structured object generation guarantees that the LLM response conforms exactly to a specified JSON schema. It uses **Zod** to validate, parse, and enforce typing.

### 3.1 One-Shot Object Generation (`generateObject`)
```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    complianceLevel: z.enum(['low', 'medium', 'high']),
    breachesDetected: z.array(z.string()),
    automaticSuspensionRisk: z.boolean(),
  }),
  prompt: 'Analyze this bid rejection letter: SME rejected due to late accounts filing, appeal period is active.',
});

// "object" is fully typed with TypeScript autocomplete!
if (object.automaticSuspensionRisk) {
  console.log('Procurement Act 2023 s.51 automatic suspension applies.');
}
```

### 3.2 Real-Time Object Streaming (`streamObject`)
Streams the structured object as it is being progressively resolved, letting the browser render partially parsed JSON fields instantly.
```typescript
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await streamObject({
  model: openai('gpt-4o'),
  schema: z.object({
    outline: z.array(z.string()),
    executiveSummary: z.string(),
  }),
  prompt: 'Draft an executive transformation plan.',
});

for await (const partialObject of result.partialObjectStream) {
  console.clear();
  console.log('Streaming partial output:', partialObject);
}
```

---

## 4. ERROR HANDLING & RESILIENCE
To handle network dropouts, API rate limits, or validation failures, use robust try-catch blocks and inspect SDK-specific error classes.

```typescript
import { generateText, AISDKError } from 'ai';
import { openai } from '@ai-sdk/openai';

try {
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: 'Analyze G-Cloud framework.',
  });
} catch (error) {
  if (error instanceof AISDKError) {
    console.error('AI SDK Specific Error:', error.message);
    // Handle model-specific errors
  } else {
    console.error('Generic execution error:', error);
  }
}
```


--- FILE SPLIT: 03_ai_sdk_core_embeddings_and_multimodal.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## CHAPTER 03: AI SDK CORE — EMBEDDINGS, RERANKING, & MULTI-MODAL SYNTHESIS

This chapter covers vector representations of semantic context, advanced document ranking, and generating multi-modal outputs (images, speech, audio).

---

## 1. EMBEDDINGS & RERANKING

### 1.1 Generating Embeddings (`embed` & `embedMany`)
Embeddings translate raw text into high-dimensional numerical vectors. These are the mathematical foundations for semantic search, vector databases, and Retrieval-Augmented Generation (RAG).

```typescript
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

// Generate a single embedding vector
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'Procurement Act 2023 standstill regulation',
});

console.log('Embedding dimensions:', embedding.length); // Typically 1536

// Generate multiple embeddings in a single optimized batch call
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: [
    'Carbon Reduction Plan requirements PPN 06/21',
    'Social Value Model requirements PPN 06/20',
  ],
});
```

### 1.2 Document Reranking (`rerank`)
Reranking improves RAG systems by performing a secondary, highly precise evaluation of retrieved search chunks, re-sorting them to match the query before constructing the final model prompt.

```typescript
import { rerank } from 'ai';
import { cohere } from '@ai-sdk/cohere';

const { rankings } = await rerank({
  model: cohere.rerank('rerank-english-v3.0'),
  query: 'Automatic procurement suspension triggers',
  documents: [
    { text: 'A Carbon Reduction Plan is mandatory for UK bids over £5M under PPN 06/21.' },
    { text: 'Automatic suspension of contract award is triggered under section 51 of the Procurement Act 2023.' },
    { text: 'Standard G-Cloud liability limitations conform to the Unfair Contract Terms Act 1977.' },
  ],
  topN: 2, // Return only the top 2 highest ranking documents
});

console.log('Ranked outputs:', rankings);
```

---

## 2. MULTI-MODAL IMAGE SYNTHESIS (`generateImage`)
Used to programmatically synthesize images from natural language prompt descriptions.

```typescript
import { generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Fintech dashboard flat design, rich navy blue background, modern amber graphs and cards, highly detailed',
  size: '1024x1024',
  aspectRatio: '1:1',
});

// Save synthesized image to local disk
fs.writeFileSync('dashboard.png', Buffer.from(image.base64, 'base64'));
console.log('Image synthesized and saved.');
```

---

## 3. AUDIOPRODUCTS & TRANSCRIPTIONS (`generateSpeech` & `transcribe`)

### 3.1 Text-to-Speech Synthesis (`generateSpeech`)
Synthesizes spoken audio files from written text.

```typescript
import { generateSpeech } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

const { audio } = await generateSpeech({
  model: openai.speech('tts-1'),
  voice: 'alloy', // Support: alloy, echo, fable, onyx, nova, shimmer
  prompt: 'Attention. A new procurement deadline has been registered in your compliance diary.',
});

fs.writeFileSync('alert.mp3', Buffer.from(audio));
```

### 3.2 Speech-to-Text Transcription (`transcribe`)
Transcribes spoken MP3/WAV files back into structured plain text.

```typescript
import { transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

const { text } = await transcribe({
  model: openai.transcribe('whisper-1'),
  file: fs.readFileSync('./board_meeting.wav'),
});

console.log('Meeting Transcript:', text);
```

---

## 4. VIDEO & MEDIA FILES (`experimental_generateVideo` & `uploadFile`)

### 4.1 AI Video Generation (`experimental_generateVideo`)
Streams generative video frames from prompting context (beta).
```typescript
import { experimental_generateVideo } from 'ai';
import { luma } from '@ai-sdk/luma'; // Sample hypothetical provider

const { video } = await experimental_generateVideo({
  model: luma.video('luma-ray-1-0'),
  prompt: 'A panning shot of a high-tech corporate office building, 4k cinematic resolution',
});
// Save raw video data
```

### 4.2 File Uploads (`uploadFile`)
Uploads files directly to a model provider's secure execution context (for multi-modal processing).
```typescript
import { uploadFile } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'fs';

const fileRef = await uploadFile({
  model: google('gemini-1.5-pro'),
  file: fs.readFileSync('technical_specs.pdf'),
  mimeType: 'application/pdf',
});

console.log('File successfully uploaded with reference ID:', fileRef.id);
```


--- FILE SPLIT: 04_tools_and_agents.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## CHAPTER 04: TOOLOOPAGENT, HARNESSAGENT, & MULTI-STEP CONTEXT

This chapter details the primary agentic classes of the Vercel AI SDK, providing a reference for custom autonomous loops, pre-built harnesses, and context isolation.

---

## 1. THE `ToolLoopAgent` CLASS
The `ToolLoopAgent` is the recommended abstraction for building custom autonomous loops around a language model and a set of tools. It manages message histories, handles token billing, and recursively runs step-generation cycles until stopping conditions are met.

### 1.1 Complete API Structure
```typescript
import { ToolLoopAgent, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const weatherAgent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  system: 'You are an autonomous coordinator.',
  tools: {
    getWeather: tool({
      description: 'Get weather in a specific location.',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => ({ location, temp: 72 })
    })
  },
  // Stop after 10 loops or when specific tools are triggered
  stopWhen: isStepCount(10),
  // Life-cycle hook to execute context compaction or inject instructions
  prepareStep: ({ messages, runtimeContext }) => {
    if (messages.length > 20) {
      // compact history...
    }
    return { instructions: 'System status normal.' };
  }
});
```

---

## 2. RUNTIME CONTEXT & PER-TOOL CONTEXTS

### 2.1 Shared Agent State (`runtimeContext`)
`runtimeContext` carries dynamic application state through the execution loop. It is available in step-preparation functions and callbacks.

### 2.2 Isolated Tool Context (`toolsContext`)
To protect sensitive credentials (like Stripe API keys or custom tokens), use `toolsContext`. It ensures that each tool receives only its own typed context schema, completely isolated from other tools.

```typescript
const secureTool = tool({
  inputSchema: z.object({ userId: z.string() }),
  contextSchema: z.object({ dbToken: z.string() }),
  execute: async ({ userId }, { context }) => {
    // Only this tool can access the private dbToken key
    const res = await queryDb(userId, context.dbToken);
    return { status: 'success', data: res };
  }
});

const agent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  tools: { secure: secureTool }
});

const result = await agent.generate({
  prompt: 'Retrieve records for user 123.',
  runtimeContext: { trackingId: 'trace-777' },
  toolsContext: {
    secure: { dbToken: 'secure_auth_token_999' }
  }
});
```

---

## 3. PRE-BUILT HARNESS RUNNERS (`HarnessAgent`)
When integrating pre-built agentic harnesses (such as **Claude Code**, **Pi**, or **Codex**) rather than compiling custom tool-calling loops, use the `HarnessAgent`. This maps raw processes into standard AI SDK stream structures.

```typescript
import { HarnessAgent } from 'ai';
import { claudeCodeAdapter } from '@ai-sdk/harness-claude-code';

const claudeAgent = new HarnessAgent({
  adapter: claudeCodeAdapter({
    workspaceDir: '/home/user/workspace',
    allowCommands: ['npm run test', 'git status'],
  })
});

const result = await claudeAgent.execute({
  instruction: 'Audit and repair any security weaknesses.',
});
```

---

## 4. MODEL CONTEXT PROTOCOL (MCP) INTEGRATION
The Model Context Protocol (MCP) standardizes how models connect to external data sources. The AI SDK implements this via stdio transports.

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp-stdio-transport';

// Bind to local MCP server using standard command line transport
const localFilesMcp = new Experimental_StdioMCPTransport({
  command: 'node',
  args: ['/path/to/mcp-server-filesystem/dist/index.js', '/home/user/my-project'],
});

const response = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Summarize all configuration files in this directory.',
  // Dynamic tool mapping directly from MCP server
  tools: localFilesMcp.tools,
});

console.log(response.text);
```


--- FILE SPLIT: 05_ai_sdk_ui_integration.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## CHAPTER 05: FRONTEND INTEGRATION, useChat HOOK, & STREAM PROTOCOLS

This chapter outlines how to wire streaming AI responses, custom data, and multi-step agent actions into modern frontends (Next.js, Svelte, Vue, SvelteKit).

---

## 1. HOOKS AND FRONTEND STATE

### 1.1 The `useChat` Hook
Tracks user input, messages arrays, errors, loading indicators, and automatically handles server stream parsing.

```tsx
'use client';

import { useChat } from '@ai-sdk/react';

export default function ChatView() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, status } = useChat({
    api: '/api/chat', // Next.js API endpoint
    initialMessages: [
      { id: 'init', role: 'system', content: 'You are an elite procurement assistant.' }
    ],
    onFinish: (message) => {
      console.log('Stream finished. Message received:', message.content);
    },
    onError: (error) => {
      console.error('Streaming failure:', error.message);
    }
  });

  return (
    <div class="flex flex-col h-screen p-6 bg-slate-950 text-white">
      <div class="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map(m => (
          <div key={m.id} class={`p-3 rounded-lg ${m.role === 'user' ? 'bg-slate-800' : 'bg-slate-700'}`}>
            <span class="font-bold text-[10px] text-amber-400 uppercase">{m.role}</span>
            <p class="text-sm mt-1">{m.content}</p>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} class="flex gap-2">
        <input 
          value={input} 
          onChange={handleInputChange} 
          placeholder="Type your message..." 
          class="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm text-white"
        />
        <button type="submit" class="bg-amber-600 hover:bg-amber-700 font-bold px-4 py-2 rounded text-sm transition">
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## 2. STREAM PROTOCOLS & SERVER ACTIONS

### 2.1 Envelopes, annotations, and custom data (`messageMetadata`)
Vercel AI SDK 5.0+ introduces standardized stream protocols that package raw text chunks alongside custom metadata, OpenTelemetry traces, or custom tool execution statuses.

```typescript
import { streamText, convertToModelMessages, createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(messages),
  });

  // Package the text stream with rich annotations/metadata envelopes
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ 
      stream: result.stream,
      // Inject custom annotations that the frontend can read in useChat message objects
      annotations: [
        { type: 'sourcesUsed', data: ['Procurement Act 2023 s.51', 'PPN 06/21'] },
        { type: 'agentRoute', data: 'ComplianceRadarAgent' }
      ]
    }),
  });
}
```

---

## 3. CLIENT-SIDE TOOL CALL EXECUTION (`onToolCall`)
When a model triggers a tool call, but the tool must execute on the client side (e.g., getting browser geolocation, popping up a user confirmation model, or modifying local state), handle the execution inside the frontend hook:

```tsx
const { messages, append } = useChat({
  api: '/api/chat',
  onToolCall: async ({ toolCall }) => {
    if (toolCall.toolName === 'requestClientCoordinates') {
      // Get browser latitude and longitude
      const coords = await getBrowserCoordinates();
      
      // Auto-submit the result back to the server to resume generation
      return {
        toolName: 'requestClientCoordinates',
        toolCallId: toolCall.toolCallId,
        result: coords,
      };
    }
  }
});
```


--- FILE SPLIT: 06_provider_directory.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## CHAPTER 06: COMPREHENSIVE PROVIDER DIRECTORY & CONFIGURATION VARIATIONS

This chapter provides an exhaustive directory of all model providers supported by the Vercel AI SDK, detailing packages, model strings, commands, and unique features.

---

## 1. COMPREHENSIVE PROVIDER INDEX

| Provider | SDK Package | Sample Model Initialization | Prompt Caching | Extended Thinking | Strict Mode |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **OpenAI** | `@ai-sdk/openai` | `openai('gpt-4o')`<br/>`openai('gpt-4o-mini')` | Automatic | No | **Yes** (`strict: true`) |
| **Anthropic** | `@ai-sdk/anthropic` | `anthropic('claude-3-7-sonnet-20250219')` | **Manual** | **Yes** (Thinking budget) | No |
| **Google** | `@ai-sdk/google` | `google('gemini-1.5-pro-latest')` | Automatic | No | No |
| **Mistral** | `@ai-sdk/mistral` | `mistral('mistral-large-latest')` | No | No | No |
| **Grok (xAI)**| `@ai-sdk/openai` | Custom base URL configuration | No | No | No |
| **Ollama** | `ollama-ai-provider` | `ollama('llama3.1')` | Local | No | No |
| **Groq** | `@ai-sdk/groq` | `groq('llama3-70b-8192')` | No | No | No |
| **Fireworks** | `@ai-sdk/fireworks` | `fireworks('accounts/fireworks/models/kimi-k2p6')` | **Manual** | No | No |

---

## 2. DETAILED PROVIDER CONFIGURATION VARIATIONS

### 2.1 Anthropic Claude 3.7 Sonnet
Anthropic Claude 3.7 Sonnet introduces extended thinking (budgeted reasoning steps). It is state-of-the-art for agentic execution.

#### A. Extended Thinking Configuration
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const result = await generateText({
  model: anthropic('claude-3-7-sonnet-20250219', {
    thinking: {
      budget: 1024, // token budget for reasoning (minimum is typically 1024)
    }
  }),
  prompt: 'Evaluate the enforceability of absolute liability caps under UCTA 1977.',
});
```

#### B. Anthropic Manual Prompt Caching
```typescript
const result = await generateText({
  model: anthropic('claude-3-7-sonnet-20250219'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'This is a large 50-page PDF document framework standard...',
          // Set cache control block explicitly to save costs on subsequent turns
          experimental_providerChunks: [{ type: 'cache-control', cacheType: 'ephemeral' }]
        }
      ]
    }
  ]
});
```

### 2.2 OpenAI Strict Mode
OpenAI allows enforcing 100% adherence to Zod schemas on tool calls or structured outputs using `strict: true`.

```typescript
import { openai } from '@ai-sdk/openai';
import { tool } from 'ai';
import { z } from 'zod';

const strictCalculator = tool({
  description: 'Evaluate arithmetic expressions.',
  inputSchema: z.object({ expression: z.string() }),
  strict: true, // OpenAI API will enforce exact schema structure or reject response
  execute: async ({ expression }) => ({ result: eval(expression) })
});
```

### 2.3 Local Ollama (Self-Hosted / Offline execution)
Run open-source models (such as Llama 3.1, Qwen 2, or Mistral) locally on your offline machine. Great for £0 API bills and absolute data sovereignty.

```typescript
import { createOllama } from 'ollama-ai-provider';
import { generateText } from 'ai';

const ollama = createOllama({
  baseURL: 'http://localhost:11434/api', // Local server endpoint
});

const { text } = await generateText({
  model: ollama('llama3.1:8b'),
  prompt: 'Audit this local compliance text file.',
});

console.log(text);
```

### 2.4 Grok (xAI) Integration
Grok utilizes an OpenAI-compatible API interface. Bind grok models using standard OpenAI endpoints:

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const xai = createOpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const { text } = await generateText({
  model: xai('grok-4.5'),
  prompt: 'Search the web and provide current debarment guidelines for UK procurement.',
});
```


--- FILE SPLIT: 07_advanced_observability_and_custom_providers.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## CHAPTER 07: ADVANCED OBSERBABILITY, TELEMETRY, & CUSTOM PROVIDER BUILDING

This final chapter details global observability integrations via OpenTelemetry, custom middleware creation, and building your own custom provider adapters.

---

## 1. GLOBAL OBSERVABILITY & OPENTELEMETRY
OpenTelemetry integration allows you to trace exact latency, token usage, tool executions, and agent reasoning blocks in production.

### 1.1 Registering Telemetry
Call `registerTelemetry` once at your server startup or next.config.js.
```typescript
import { registerTelemetry } from 'ai';
import { OpenTelemetry } from '@ai-sdk/otel';

registerTelemetry(
  new OpenTelemetry({
    serviceName: 'bidsense-operating-system',
  })
);
```

### 1.2 Fine-Grained Telemetry Filtering
To prevent private user credentials or sensitive files from leaking to telemetry databases, configure filtering:
```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Analyze private data.',
  runtimeContext: {
    userId: 'user_private_999',
    sessionId: 'session_public_777'
  },
  telemetry: {
    functionId: 'analyze-private-data',
    // Only send the public sessionId to OpenTelemetry databases
    includeRuntimeContext: {
      sessionId: true,
    }
  }
});
```

---

## 2. WRITING CUSTOM MODEL PROVIDERS
The Vercel AI SDK language model interface is open-source. You can write your own custom adapter to bind any local or specialized HTTP model endpoint by implementing the `LanguageModelV1` interface.

```typescript
import { LanguageModelV1, LanguageModelV1GenerateResult } from 'ai';

export class LocalPrazProvider implements LanguageModelV1 {
  readonly specificationVersion = 'v1';
  readonly provider = 'local-praz';
  readonly modelId = 'praz-v1';
  readonly defaultObjectGenerationMode = undefined;

  async doGenerate(options: any): Promise<LanguageModelV1GenerateResult> {
    // Perform raw fetch call to your local model endpoint
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelId,
        messages: options.prompt,
      })
    });
    
    const data = await response.json();
    
    return {
      text: data.choices[0].message.content,
      finishReason: 'stop',
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      },
      rawCall: { rawPrompt: options.prompt, rawSettings: {} }
    };
  }
}

// Instantiate and execute your custom model adapter
const localPrazModel = new LocalPrazProvider();
```


--- FILE SPLIT: vol_1_foundations_getting_started.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 1: FOUNDATIONS & GETTING STARTED INDEX

This volume outlines the core foundational layers, design principles, provider configurations, and boilerplate setups across all supported framework runtimes.

---

## 1. FOUNDATIONS

### 1.1 Overview (ai-sdk.dev/docs/foundations/overview)
The Vercel AI SDK is a unified development framework that decouples application code from LLM APIs. By standardizing language model calls into uniform TypeScript signatures, developers can change models, switch providers, and build robust, observable agents with zero re-writing of core business logic.

### 1.2 Providers and Models (ai-sdk.dev/docs/foundations/providers-and-models)
The SDK divides provider integration into two main specifications:
1.  **LanguageModelV1:** Standardized interface for text generation, token usage estimation, structured JSON schema outputs, and multi-step tool execution.
2.  **EmbeddingModelV1:** Standardized interface for generating high-dimensional numerical vector representations of semantic context.

The open-source community maintains adapters for numerous local and cloud providers, including Ollama (`ollama-ai-provider`), Cloudflare Workers AI (`workers-ai-provider`), Portkey, FriendliAI, and OpenRouter.

### 1.3 Prompts & Prompt Engineering (ai-sdk.dev/docs/foundations/prompts)
Prompts can be supplied using three formats:
- `prompt`: Standard natural-language string.
- `system`: System instructions to guide the behavior, persona, or boundaries of the model.
- `messages`: Fully reactive arrays of chat messages (`ModelMessage[]`) supporting role histories (`'user' | 'assistant' | 'system' | 'tool'`).

### 1.4 Tools (ai-sdk.dev/docs/foundations/tools)
A Tool extends model capabilities, allowing it to interface with external APIs or databases. Instantiated via `tool()`, it enforces type-safety on arguments using Zod, Valibot, or JSON schemas, and supports automatic execution via `execute`.

### 1.5 Streaming (ai-sdk.dev/docs/foundations/streaming)
The SDK supports streaming text, objects, and UI elements in real-time, utilizing custom-built ReadableStreams and the Server-Sent Events (SSE) protocol to handle backpressure and guarantee zero-latency rendering.

### 1.6 Provider Options (ai-sdk.dev/docs/foundations/provider-options)
Pass provider-specific flags (e.g. OpenAI user tracking, Anthropic cache-control, Fireworks promptCacheKey) within the `providerOptions` property, letting developers access advanced parameters without breaking the unified model interface.

---

## 2. GETTING STARTED CONFIGURATIONS

### 2.1 Next.js App Router Setup
```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  });
  return result.toDataStreamResponse();
}
```

### 2.2 Next.js Pages Router Setup
```typescript
// pages/api/chat.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messages } = req.body;
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  });
  result.pipeDataStreamToResponse(res);
}
```

### 2.3 Svelte / SvelteKit Setup
```typescript
// src/routes/api/chat/+server.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST({ request }) {
  const { messages } = await request.json();
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  });
  return result.toDataStreamResponse();
}
```

### 2.4 Vue.js (Nuxt) Setup
```typescript
// server/api/chat.post.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);
  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  });
  return result.toDataStreamResponse();
});
```

### 2.5 Node.js CLI Setup
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

async function main() {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt: 'Evaluate local G-Cloud compliance.',
  });
  console.log(text);
}
main().catch(console.error);
```

### 2.6 Expo (React Native) Setup
Utilizes the lightweight `@ai-sdk/react` package with custom stream responses optimized for native mobile runtimes, bypassing standard Node.js server dependencies.

### 2.7 TanStack Start Setup
Binds serverless loader functions to stream text and objects natively in a full-stack type-safe router environment.

### 2.8 Coding Agents Setup
Outlines patterns for configuring system prompts, file-replacement text editor tools, and terminal command execution boundaries to build autonomous software-engineering agents.


--- FILE SPLIT: vol_2_ai_sdk_core_generation_realtime.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 2: AI SDK CORE — TEXT GENERATION, STRUCTURED DATA, SETTINGS, & REASONING

This volume contains exhaustive API references, commands, imports, schemas, and configurations for Vercel AI SDK Core. It is optimized for direct consumption by advanced coding LLMs.

---

## 1. TEXT GENERATION (`generateText` & `streamText`)

### 1.1 One-Shot Generation (`generateText`)
Generates non-streaming text, tool calls, and usage statistics in a single-shot execution.

#### A. Detailed API & Import Reference
```typescript
import { generateText, type LanguageModel, type Message } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4o') as LanguageModel,
  prompt: 'Draft an absolute liability cap clause compliant with UCTA 1977.',
  system: 'You are an elite corporate procurement solicitor in the UK.',
  messages: [
    { role: 'user', content: 'What is the standard ceiling for G-Cloud?' },
    { role: 'assistant', content: 'The standard ceiling depends on the lot...' }
  ],
  temperature: 0.2, // 0.0 to 2.0
  maxTokens: 2000,
  topP: 0.95,
  presencePenalty: 0.1,
  frequencyPenalty: 0.1,
  headers: { 'X-Custom-Org-Id': 'bidsense_Y1' },
});

// Extraction commands
console.log('Output Text:', result.text);
console.log('Tokens Consumed:', result.usage.totalTokens);
console.log('Finish Reason:', result.finishReason); // 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error'
```

### 1.2 Real-Time Text Streaming (`streamText`)
Streams text tokens immediately as they are generated by the model.

#### A. Detailed API & Import Reference
```typescript
import { streamText, isStepCount } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = await streamText({
  model: anthropic('claude-3-7-sonnet-20250219'),
  prompt: 'Draft a G-Cloud framework compliance checklist.',
  stopWhen: isStepCount(5),
});

// Read the text stream directly
for await (const textChunk of result.textStream) {
  process.stdout.write(textChunk);
}

// Access underlying stream protocol response
const response = result.toDataStreamResponse();
```

---

## 2. STRUCTURED DATA GENERATION (`generateObject` & `streamObject`)
Structured output forces the LLM to conform exactly to a specified JSON schema, completely resolving the problem of model hallucinations.

### 2.1 Importing Schemas & Validation Libraries
The SDK supports Zod, Valibot, or raw JSON Schema representations of target schemas.

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod'; // Standard schema validator

const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    complianceScore: z.number().min(0).max(100).describe('Compliance level from 0 to 100.'),
    expiredCertificates: z.array(z.string()).describe('List of expired corporate certs.'),
    hasActiveSuspensionRisk: z.boolean().describe('True if automatic suspension risk applies.'),
  }),
  prompt: 'Check compliance for BidSense Ltd: ISO 27001 expired 10 days ago. ISO 9001 is active.',
});

// Fully type-safe fields
console.log('Score:', object.complianceScore);
console.log('Risk:', object.hasActiveSuspensionRisk);
```

### 2.2 Streaming Structured JSON (`streamObject`)
Streams progressive additions to the structured JSON object, allowing UI layers to render partial data before compilation is complete.
```typescript
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await streamObject({
  model: openai('gpt-4o'),
  schema: z.object({
    auditSteps: z.array(z.object({
      stepNumber: z.number(),
      remediationPlan: z.string(),
    })),
  }),
  prompt: 'Generate an audit remediation plan for ISO 27001.',
});

for await (const partialObject of result.partialObjectStream) {
  console.clear();
  console.log(JSON.stringify(partialObject, null, 2));
}
```

---

## 3. SETTINGS & REASONING (EXTENDED THINKING CONFIGURATION)
For reasoning models (such as **Claude 3.7 Sonnet** or **OpenAI o1/o3-mini**), developers can explicitly allocate a reasoning token budget (extended thinking) to handle complex structural problems.

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const result = await generateText({
  model: anthropic('claude-3-7-sonnet-20250219', {
    thinking: {
      budget: 1500, // Allocate 1500 tokens for internal scratchpad reasoning
    }
  }),
  prompt: 'Calculate the cumulative Year 3 net profits under our Base scenario, accounting for subcontractor payouts.',
});

console.log('Answer:', result.text);
console.log('Reasoning Log:', result.reasoning); // Access internal reasoning logs directly
```

---

## 4. EMBEDDINGS & RERANKING
- **`embed`:** Converts raw text into a numerical vector array.
- **`embedMany`:** Processes multiple texts in a single optimized batch request.
- **`rerank`:** Sorts document chunks against a search query using Cohere's rerank engine, optimizing RAG prompt inputs.

---

## 5. AUDIO & VISUAL SYNTHESIS
- **`generateImage`:** Synthesizes corporate PNG files programmatically.
- **`generateSpeech`:** Converts text into spoken audio files.
- **`transcribe`:** Converts spoken WAV/MP3 files back into plain text.
- **`experimental_generateVideo`:** Streams video segments (Luma Ray).
- **`uploadFile` & `uploadSkill`:** Mounts heavy media files or custom pre-trained skill weights directly to the Gemini or Claude model runtimes.


--- FILE SPLIT: vol_3_tool_calling_mcp_sandboxes.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 3: TOOL CALLING, MODEL CONTEXT PROTOCOL (MCP), & EXECUTION CONTEXTS

This volume outlines the detailed technical specifications, commands, imports, and schemas for tools, Model Context Protocol (MCP) clients, and execution contexts.

---

## 1. THE `tool` PRIMITIVE & AUTO-EXECUTION

### 1.1 Basic Tool Registration
A tool defines an schema and an execute function, which is automatically triggered when called by the model.

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const currencyConverter = tool({
  description: 'Convert currency values.',
  inputSchema: z.object({
    amount: z.number().describe('The money amount to convert.'),
    from: z.string().describe('The 3-letter currency code to convert from, e.g. USD.'),
    to: z.string().describe('The 3-letter currency code to convert to, e.g. GBP.'),
  }),
  strict: true, // Forces exact JSON schema validation by the provider
  execute: async ({ amount, from, to }) => {
    // Conversion logic
    const rate = 0.78; // Mock USD to GBP
    return { amount, from, to, convertedAmount: amount * rate };
  }
});
```

### 1.2 `dynamicTool` (Runtime Tool Loading)
Use `dynamicTool` when tool definitions, schemas, or execute functions need to change dynamically on every conversation turn based on user permissions or runtime parameters.

```typescript
import { dynamicTool } from 'ai';

const myDynamicTool = dynamicTool({
  description: 'A tool that updates schema dynamically.',
  execute: async (args, { messages }) => {
    // Dynamic execution logic...
    return { status: 'success' };
  }
});
```

---

## 2. MODEL CONTEXT PROTOCOL (MCP) TOOLS & APPS
The Model Context Protocol (MCP) standardizes how models connect to external tools, databases, and file directories. The SDK supports native STDIO and HTTP transports.

### 2.1 Importing & Registering an MCP Client
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp-stdio-transport';

// Connect to local Node.js filesystem server via stdio transport
const localFilesMcp = new Experimental_StdioMCPTransport({
  command: 'node',
  args: ['/path/to/mcp-server-filesystem/dist/index.js', '/tmp/workspace'],
});

const response = await generateText({
  model: openai('gpt-4o'),
  // Standard tool mapping directly from the MCP server
  tools: localFilesMcp.tools,
  prompt: 'Write Hello World into example.txt inside the workspace.',
});

console.log(response.text);
```

### 2.2 MCP Apps Configuration
MCP Apps expose complete sandboxed rendering environments, binding tool schemas and visual cards directly to web client components using `@ai-sdk/react`.

---

## 3. RUNTIME & TOOL CONTEXTS (CREDENTIALS ISOLATION)
- **`runtimeContext`:** Shared operational state of the agent loop (user IDs, requests, session plans) that flows through `prepareStep`, approvals, and telemetry.
- **`toolsContext`:** An isolated, per-tool configuration map. When executing, each tool receives *only* its own private credentials schema, completely shielding other tools from credentials leakage.

```typescript
const secureDbQuery = tool({
  inputSchema: z.object({ query: z.string() }),
  contextSchema: z.object({ dbToken: z.string() }),
  execute: async ({ query }, { context }) => {
    // context.dbToken is securely isolated here
    return { results: await queryDatabase(query, context.dbToken) };
  }
});
```

---

## 4. EXPERIMENTAL SANDBOXES (`Experimental_SandboxSession`)
To execute untrusted, model-generated code safely (such as Python data analysis or bash command execution), developers can integrate sandboxed execution runtimes:

- **`Experimental_SandboxSession`:** Manages the lifecycle of secure, isolated VM containers (e.g. Docker, E2B, WASM) where code is run and outputs are fetched securely.
- Only operations explicitly passed to the sandbox (e.g., `sandbox.run(...)`) execute within the secure boundary.


--- FILE SPLIT: vol_4_agents_workflows_tui.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 4: AUTONOMOUS AGENTS, SUBAGENTS, WORKFLOWS, & WORKFLOWAGENT

This volume details the advanced Agentic, Multi-Agent, and Workflow architectures of the Vercel AI SDK. It covers `ToolLoopAgent`, Subagents handoffs, and the durable `WorkflowAgent` framework.

---

## 1. THE `ToolLoopAgent` CLASS (IN-MEMORY AGENTS)
The `ToolLoopAgent` is the standard class for building custom model-and-tools loops. It manages message histories, handles recursive generations, and executes tool calls internally.

```typescript
import { ToolLoopAgent, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const researcherAgent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  system: 'You are an autonomous research coordinator.',
  tools: {
    searchDatabase: tool({
      description: 'Search G-Cloud price registries.',
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => ({ results: ['Glaxton framework program: £28,000'] })
    })
  }
});
```

---

## 2. SUBAGENTS & MULTI-AGENT HANDOFFS
To build complex, multi-agent networks, a parent agent can delegate tasks to specialized subagents. This is implemented by wrapping a subagent's execution call inside a standard tool.

```typescript
import { ToolLoopAgent, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Specialized Subagent
const technicalAgent = new ToolLoopAgent({
  model: openai('gpt-4o-mini'),
  system: 'You are an expert technical auditor. Detail database and hosting compliance.',
  tools: { /* ... */ }
});

// Parent Agent
const triageAgent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  system: 'You are the central router. Route technical queries to the Technical Subagent.',
  tools: {
    // Handoff is packaged as a standard tool!
    delegateToTechnical: tool({
      description: 'Delegate technical architecture audits to the Technical Subagent.',
      inputSchema: z.object({
        technicalPrompt: z.string().describe('The specific technical query to audit.'),
      }),
      execute: async ({ technicalPrompt }) => {
        // Run the subagent and return the results directly back to the parent loop
        const result = await technicalAgent.generate({
          prompt: technicalPrompt,
        });
        return { technicalReport: result.text, stepsTaken: result.steps.length };
      }
    })
  }
});
```

---

## 3. THE `WorkflowAgent` CLASS (DURABLE & RESUMABLE AGENTS)
While standard in-memory agents (`ToolLoopAgent`) run entirely in memory (and lose state on serverless timeouts, page refreshes, or process restarts), **`WorkflowAgent`** from the `@ai-sdk/workflow` package runs durably inside a **Vercel Workflow**.

### 3.1 Durability & Step Preservation
- Every tool call is marked with `'use step'` and becomes a durable step that persists progress across process boundaries.
- If a step fails, the workflow automatically retries from the last checkpoint, rather than restarting the entire loop.
- Tools marked `needsApproval: true` suspend the workflow for hours or days, resuming immediately when the user responds.

### 3.2 Durable WorkflowAgent Implementation
```typescript
import { WorkflowAgent, type ModelCallStreamPart } from '@ai-sdk/workflow';
import { tool } from 'ai';
import { getWritable } from 'workflow'; // From Workflow DevKit
import { z } from 'zod';

// Step functions have full Node.js access and automatic persistence
async function searchFlightsStep(input: { origin: string; destination: string; date: string; }) {
  'use step';
  const response = await fetch(`https://api.flights.example/search?from=${input.origin}&to=${input.destination}`);
  return response.json();
}

export async function chatWorkflow(messages: any[]) {
  'use workflow'; // Durable workflow boundary

  const agent = new WorkflowAgent({
    model: 'anthropic/claude-3-7-sonnet-20250219',
    instructions: 'You are a flight booking assistant. Search flights and book them.',
    tools: {
      searchFlights: tool({
        description: 'Search for available flights',
        inputSchema: z.object({
          origin: z.string(),
          destination: z.string(),
          date: z.string(),
        }),
        execute: searchFlightsStep,
      }),
    },
  });

  const result = await agent.stream({
    messages,
    writable: getWritable<ModelCallStreamPart>(),
  });

  return { messages: result.messages };
}
```

---

## 4. WORKFLOWCHATTRANSPORT (STREAM INTERFACE)
`WorkflowChatTransport` connects durable `WorkflowAgent` runs directly to streaming web interfaces built with `useChat`. If the connection is aborted or timed out, the transport handles reconnection and resumes the stream from the last successfully received block.

---

## 5. TERMINAL TUIS (`runAgentTUI`)
To test agent loops locally with a complete, fully interactive Terminal User Interface — including streamed text, tool execution cards, reasoning blocks, and tool approval prompts — use **`@ai-sdk/tui`**:

```typescript
import { runAgentTUI } from '@ai-sdk/tui';
import { triageAgent } from './triage-agent';

await runAgentTUI({
  title: 'BidSense Triage Agent',
  agent: triageAgent,
});
```


--- FILE SPLIT: vol_5_ai_sdk_ui_chatbot_generativeui.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 5: AI SDK UI — CHATBOTS, PERSISTENCE, & GENERATIVE USER INTERFACES

This volume details the integration of streaming text, structured objects, and agent loops into interactive web frontends, including state management and chat persistence.

---

## 1. MAIN FRONTEND HOOKS

### 1.1 `useChat`
Tracks conversational message arrays, input values, streaming loading states, and automatically triggers client-side tool executions when requested.

### 1.2 `useCompletion`
Streams simplified, single-prompt autocomplete text completions.

### 1.3 `useObject`
Streams progressively resolved structured JSON objects, useful for rendering partial details (like forms, tables, or cards) before the model has finished generation.

### 1.4 `experimental_useRealtime`
Enables ultra-low latency, bidirectional web-socket-based audio/visual streams for real-time model conversations directly from client browsers.

---

## 2. CHATBOT STATE PERSISTENCE & RESUMABLE STREAMS

### 2.1 Message Persistence
Implement client-side databases or sync with backend tables to save and restore chat history on component mount.

### 2.2 Resuming streams (`resumeStream`)
If a connection drop occurs, the client can use the `resumeStream` API to reconnect and resume the stream from its last successfully received chunk.

---

## 3. CHATBOT TOOL USAGE
Frontend-defined tools execute inside the client's browser. Once client execution is complete (e.g., retrieving coordinates or signing a transaction), use the hook's returned helpers to submit results back to the server.

---

## 4. GENERATIVE USER INTERFACES (GEN-UI)
Instead of streaming standard markdown text, Gen-UI allows models to dynamically trigger rich, interactive React components (like graphs, maps, or carts) in the middle of a chat stream, updating client states on the fly.


--- FILE SPLIT: vol_6_stream_protocols_transport_metadata.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 6: STREAM PROTOCOLS, METADATA, & TRANSPORT LAYERS

This volume provides an exhaustive, low-level reference of the transport protocols, chunk formats, metadata envelopes, and stream utilities.

---

## 1. VERCEL STREAM PROTOCOLS
The AI SDK standardizes how stream data is packaged and sent over the wire. It packages standard text streams into structured chunks, interlinked with rich annotations and custom metadata.

### 1.1 Chunk Formats (The `0:` to `e:` Stream Protocol)
When streaming data using `toDataStreamResponse` or custom streams, you may notice format codes prefixing your text chunks. These are low-level envelope markers:
- **`0:text`:** Plain text chunk.
- **`1:tool_call`:** Indicates a tool call event (contains ID, tool name, and JSON arguments).
- **`2:tool_result`:** Carries a tool execution result.
- **`3:error`:** Represents an execution error.
- **`b:custom_data`:** Traditional custom metadata frame.
- **`d:message_metadata`:** Envelope containing message-level annotations.

---

## 2. MESSAGE METADATA & ANNOTATIONS (`messageMetadata`)
Developers can append custom metadata (like search documents, processing steps, or agent routes) to the stream, which is received by the client inside the message object's `annotations` array.

---

## 3. STREAM UTILITIES
- **`createUIMessageStream`:** Low-level utility to create custom, compliant UI message streams.
- **`createUIMessageStreamResponse`:** Returns a serverless-compliant HTTP response carrying the UI message stream.
- **`pipeUIMessageStreamToResponse`:** Writes the UI stream into traditional Express or Next.js Pages Router responses.
- **`readUIMessageStream`:** Reads a streaming HTTP response on the client, parsing the chunk envelopes back into message arrays.

---

## 4. TYPE INFERENCES
- **`InferUITools` & `InferUITool`:** Automatically extract and infer TypeScript types for your client-side tools and schemas, ensuring type-safe handlers inside your `onToolCall` callbacks.
- **`validateUIMessages` & `safeValidateUIMessages`:** Helper functions to validate, parse, and clean incoming client-side message structures before processing.


--- FILE SPLIT: vol_7_ai_sdk_rsc_server_components.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 7: AI SDK RSC — REACT SERVER COMPONENTS & STREAMABLE CORES

This volume details the now deprecated-but-actively-maintained React Server Components (RSC) layer, showing how to stream visual components directly from the server.

---

## 1. STREAMING REACT COMPONENTS (`streamUI`)
`streamUI` lets you stream rich, interactive visual React components directly from server-side files to the client, providing a smooth, server-driven UI rendering experience.

```typescript
import { streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { StockCard } from '@/components/StockCard';

export async function submitMessage(prompt: string) {
  const ui = await streamUI({
    model: openai('gpt-4o'),
    prompt,
    tools: {
      showStockPrice: {
        description: 'Render the stock card for a given company ticker.',
        parameters: z.object({ ticker: z.string() }),
        generate: async function* ({ ticker }) {
          yield <div>Searching stock price for {ticker}...</div>;
          const price = 175.50; // Mock database call
          return <StockCard ticker={ticker} price={price} />;
        }
      }
    }
  });
  return ui;
}
```

---

## 2. STATE MANAGEMENT IN RSC
- **`createAI`:** Initializes the AI context on the server, defining the shapes of your `AIState` (persisted server state) and `UIState` (rendered client state).
- **`createStreamableUI` & `createStreamableValue`:** Utilities to create reactive, streamable values or components that can be pushed to the client during execution.
- **`readStreamableValue` & `useStreamableValue`:** Standard helpers to consume and read these streaming states on the client.
- **State Helpers:**
  - `getAIState()`: Retrieve the current persisted server state.
  - `getMutableAIState()`: Fetch a mutable copy of the server state inside actions.
  - `useAIState()`, `useUIState()`, `useActions()`: Client-side hooks to interact with RSC context.

---

## 3. MIGRATION TO AI SDK UI (`Migrating from RSC to UI`)
Since Vercel AI SDK 5.0, the **RSC layer is officially deprecated** in favor of the more flexible, robust **AI SDK UI** stream envelopes and generative UI schemas. 

To migrate, developers should move component rendering to the client, utilizing `streamText` with tool calls on the server, and handling visual component rendering inside the client-side `onToolCall` or custom message annotations.


--- FILE SPLIT: vol_8_advanced_caching_rate_limiting.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 8: ADVANCED OPTIMIZATIONS — CACHING, RATE LIMITING, & BACKPRESSURE

This volume covers scaling, optimizing, and securing high-volume AI SDK production apps, detailing caching, rate limiting, and backpressure management.

---

## 1. PROMPT CACHING & PERFORMANCE
To decrease latency and reduce API billing costs, models can cache static prompt contexts (such as massive 50-page PDF system instructions or document reference files).
- **OpenAI/Anthropic Caching:** Most major providers support automatic or manual ephemeral prompt caching (cache-control).
- **Fireworks caching:** Set `promptCacheKey` in provider options to improve cache affinity across replica clusters.

---

## 2. BACKPRESSURE & STREAM CONTROL
To ensure browser UI interfaces remain smooth and responsive when receiving high-speed streamed chunks:
- **`smoothStream`:** Smooths out chunk arrivals, ensuring a natural, human-readable typewriter effect instead of erratic, high-speed burst rendering.
- **`simulateReadableStream`:** Utility to mock and simulate custom readable streams for local testing.

---

## 3. CACHING STRATEGIES
Implement edge-cache headers (such as `s-maxage` or `stale-while-revalidate`) inside serverless routes to cache common responses (like structured compliance checklists or static regulatory summaries), saving token execution costs.

---

## 4. RATE LIMITING & BACKOFF
Enforce strict rate limits on your API endpoints to protect against DDoS or token spamming. Use packages like `@upstash/ratelimit` or Redis-based sliding windows inside your Next.js middlewares. If the provider returns 429 Rate Limit errors, the SDK's internal `retry` policy automatically handles exponential backoff.

---

## 5. SECURE URL FETCHING
When utilizing tools that fetch external URLs (such as web scrapers or link searchers), route fetches through secure proxy networks or validate targets against IP blocklists to prevent Server-Side Request Forgery (SSRF) vulnerabilities.


--- FILE SPLIT: vol_9_ai_sdk_errors_directory.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 9: COMPLETE EXHAUSTIVE DIRECTORY OF AI SDK ERRORS

This volume acts as an exhaustive directory of all custom execution error classes emitted by the Vercel AI SDK, detailing their codes, causes, and standard fixes.

---

## 1. MODEL & CALL ERRORS

### `AI_APICallError`
- **Cause:** The provider API returned an HTTP error code (e.g. 401 Unauthorized, 429 Rate Limit, 500 Server Error).
- **Standard Fix:** Check API credentials, verify rate limits, and implement retry backoffs.

### `AI_NoSuchModelError` / `AI_NoSuchModelReferenceError`
- **Cause:** The requested model ID does not exist in the specified provider registry.
- **Standard Fix:** Verify the model name against the provider's active model list.

### `AI_NoSuchProviderError`
- **Cause:** The specified provider name is not registered.
- **Standard Fix:** Import and register the correct provider.

---

## 2. STRUCTURED GENERATION ERRORS

### `AI_NoContentGeneratedError`
- **Cause:** The model completed generation without returning any text content.
- **Standard Fix:** Review prompt or temperature settings; ensure the model wasn't blocked by content filters.

### `AI_NoObjectGeneratedError`
- **Cause:** The structured generation function (`generateObject`) completed, but failed to return a valid JSON object matching the Zod schema.
- **Standard Fix:** Review schema complexity; use a more capable reasoning model (GPT-4o/Claude 3.7 Sonnet).

### `AI_TypeValidationError`
- **Cause:** The model returned a JSON object, but Zod schema parsing failed due to incorrect field types or missing required properties.
- **Standard Fix:** Refine prompt instructions to explicitly demand adherence to the schema; use `strict: true` if supported.

---

## 3. TOOL CALL & APPROVAL ERRORS

### `AI_NoSuchToolError`
- **Cause:** The model generated a tool call for a tool name that is not registered in the `tools` config.
- **Standard Fix:** Ensure the tool is correctly declared in the call parameters.

### `AI_InvalidToolInputError`
- **Cause:** The model called a registered tool, but the generated input arguments failed the tool's `inputSchema` Zod validation.
- **Standard Fix:** Improve tool description to guide model argument construction.

### `AI_ToolCallNotFoundForApprovalError`
- **Cause:** The `toolApproval` function was executed, but no matching tool call ID was found.
- **Standard Fix:** Verify tool call lifecycle states.

### `AI_InvalidToolApprovalError`
- **Cause:** The tool approval callback returned an invalid or unsupported status structure.
- **Standard Fix:** Verify that callbacks return `'approved' | 'denied' | 'user-approval' | undefined`.

---

## 4. OTHER ERROR CODES (INDEX)
- `AI_DownloadError`: Failed to download a required media file or asset.
- `AI_EmptyResponseBodyError`: The API returned an empty 200 OK response body.
- `AI_InvalidArgumentError`: Invalid argument types passed to SDK core functions.
- `AI_InvalidDataContentError`: Multi-modal media attachment data is corrupt or invalid.
- `AI_InvalidMessageRoleError`: Message array contains an unsupported role identifier.
- `AI_InvalidPromptError`: Prompt formatting is invalid or empty.
- `AI_InvalidResponseDataError`: The API returned unstructured or corrupted response payloads.
- `AI_JSONParseError`: Failed to parse raw model text into a JSON object.
- `AI_LoadAPIKeyError`: Failed to locate the required API key in environment variables.
- `AI_LoadSettingError`: Internal provider options load error.
- `AI_MessageConversionError`: Message format conversion error.
- `AI_NoImageGeneratedError` / `AI_NoSpeechGeneratedError` / `AI_NoTranscriptGeneratedError` / `AI_NoVideoGeneratedError`.
- `AI_RetryError`: The SDK completed its retry sequence and failed.
- `AI_TooManyEmbeddingValuesForCallError`.
- `ToolCallRepairError`: AI auto-repair of tool call arguments failed.
- `AI_UIMessageStreamError`: UI message stream parse or write failure.
- `AI_UnsupportedFunctionalityError`: The provider does not support the requested parameter (e.g. streaming structured objects).


--- FILE SPLIT: vol_10_troubleshooting_knowledge_base.md ---

# VERCEL AI SDK ULTIMATE REFERENCE MANUAL
## VOLUME 10: COMPLETE TROUBLESHOOTING KNOWLEDGE BASE

This volume lists the 25+ specific troubleshooting guides covering standard errors, edge cases, deployment bugs, and local optimization fixes.

---

## 1. PERFORMANCE & STREAMING TROUBLESHOOTING

### 1.1 useChat/useCompletion stream output contains `0:...` instead of text
- **Issue:** The streamed output in your UI chat interface shows raw format codes (e.g., `0:"Hello"`, `1:{"id":"..."}`) instead of plain parsed text.
- **Cause:** Your frontend is calling the standard `fetch` API directly or uses a legacy stream parser instead of passing the stream response to `useChat`'s native receiver. Alternatively, you are utilizing `toDataStreamResponse` on the server but your frontend package is outdated (v3.x).
- **Resolution:** Upgrading `@ai-sdk/react` to v5.0+ and ensuring the server route returns `result.toDataStreamResponse()` resolves the issue.

### 1.2 Azure OpenAI Slow to Stream
- **Issue:** Streaming chunks from Azure OpenAI are delayed, resulting in laggy burst updates.
- **Cause:** Azure's Content Filter or network buffers hold chunks until threshold limits are met, or the Azure model is deployed in a high-latency region.
- **Resolution:** Deploy your model in a regional group with lower latency, set `stream: true` in the adapter options, and verify that Azure content filtering is set to low-latency/asynchronous rules.

### 1.3 Streaming Not Working When Deployed (Vercel/Netlify)
- **Issue:** Streaming works perfectly on localhost, but when deployed, the response is buffered and arrives all at once at the very end.
- **Cause:** The hosting platform's proxy network or edge middleware is buffering the response, or you are utilizing an old serverless configuration.
- **Resolution:** For Vercel, ensure you do not use Server Actions for streaming, and configure the route with `export const maxDuration = 30;` and proper chunk headers.

---

## 2. MODEL & TOOL CALL TROUBLESHOOTING

### 2.1 Tool Invocation Missing Result Error
- **Issue:** Execution fails with "Tool invocation missing result" error.
- **Cause:** The model triggered a tool call, but the tool did not possess an `execute` function on the server, and the client failed to submit the result back.
- **Resolution:** Add an `execute` handler on the server tool definition, or implement a client-side `onToolCall` result submission.

### 2.2 TypeScript Performance Issues with Zod and AI SDK 5
- **Issue:** Your IDE slow-scrolls, or TypeScript compilation times grow excessively when compiling deep nested schemas with Zod and the AI SDK.
- **Cause:** Complex recursive Zod schemas cause deep type-resolution loops inside the TypeScript compiler.
- **Resolution:** Simplify Zod schemas by splitting them into smaller, flat sub-objects, or use explicit typing assertions (`satisfies`).

### 2.3 Object Generation Failed with OpenAI (Content Filter)
- **Issue:** Structured generation (`generateObject`) fails with a "Content filter blocked response" or no object generated error.
- **Cause:** OpenAI's safety guardrails intercepted the generated JSON, blocking the final JSON block.
- **Resolution:** Add fallback handlers (`catch`) or use robust reasoning models with higher temperature settings.

### 2.4 Model is not assignable to type "LanguageModelV1"
- **Issue:** Passing a model instance raises a type mismatch error.
- **Cause:** Your SDK core package and provider adapter package are out-of-sync (e.g., core is v5.0, provider is v3.0).
- **Resolution:** Run `npm update ai @ai-sdk/openai @ai-sdk/anthropic` to align all packages to the same major version.


--- ADDENDUM: LOCAL OLLAMA VS CLOUD USAGE CONFUSION ---



### 2.5 local App "Usage Limit Reached" and "Free Key" Confusion
- **Issue:** You are running local apps (like Hermes Desktop or LM Studio) and selecting local models (like Nemotron or Qwen), but the app suddenly blocks you with a "Usage Limit Reached" error or says your "free tokens are exhausted."
- **Cause:** You are not actually running the model locally on your hard drive. 
  - The app is routed to a **Cloud API Gateway** (such as OpenRouter, Nvidia NIM, or MiniMax) using a "free" API key. 
  - These cloud gateways give you a tiny, metered credit pool (e.g. $5 or 100k tokens). Because agentic tasks feed massive prompts recursively, **these cloud credits are consumed in under 10 minutes**, resulting in immediate lockouts.
  - If the app requests an API key or checks your credit status, **it is talking to a cloud server, not your local machine**.
- **Resolution:**
  1. **Launch the Local Ollama Server:** Run `ollama serve` or open the Ollama desktop tray app. It must be running on your local loopback address: `http://127.0.0.1:11434`.
  2. **Disconnect the Cloud Provider in Your App:** In your Hermes Desktop or code configuration, change the provider from "OpenRouter", "xAI", or "Nvidia" to **"Local Ollama"** or **"Custom OpenAI"**.
  3. **Clear the API Key Field:** Local Ollama does not use, require, or validate API keys. Remove any key from the field, or enter a dummy placeholder (like `ollama`) if the app forces a non-empty string.
  4. **Verify Offline Execution:** Turn off your computer's Wi-Fi. If the chat or tool execution still works, you have confirmed that the model is running 100% locally on your machine with **genuine, physical infinite usage**. If it fails, your app is still calling a cloud API.
