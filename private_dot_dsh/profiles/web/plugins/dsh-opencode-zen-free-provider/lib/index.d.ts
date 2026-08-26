import type { Context } from '@deepseek-ai/cordis';
import type { RetryPolicyConfig } from '@deepseek-ai/dsh-llm';
import z from '@deepseek-ai/schemastery';
export declare const name = "opencode-zen-free-provider";
export declare const inject: string[];
export interface Config {
    /** Provider-owned model-request retry policy; omission uses normal defaults. */
    retryPolicy?: RetryPolicyConfig;
}
export declare const Config: z<Config>;
export declare function apply(ctx: Context, config: Config): Promise<void>;
