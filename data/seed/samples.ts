import * as caKhoTo from "./ca-kho-to";
import { MORE_SEEDS, SAMPLE_SOURCE } from "./more";
import type { Seed } from "./shared";

/**
 * The ten samples the app shipped with until 2026-11-23. No longer loaded on a phone; the tests
 * use them, and phones and backups from before that date still hold them.
 */
export const SAMPLE_SEEDS: Seed[] = [{ seedId: "ca-kho-to", ...caKhoTo, source: SAMPLE_SOURCE }, ...MORE_SEEDS];
