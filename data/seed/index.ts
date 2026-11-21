import * as caKhoTo from "./ca-kho-to";
import { MORE_SEEDS, SAMPLE_SOURCE, type Seed } from "./more";

/**
 * Sample recipes loaded on first run. All are stored as verification = "sample":
 * none has been cooked or checked by the family.
 */
export const SEED_RECIPES: Seed[] = [{ seedId: "ca-kho-to", ...caKhoTo, source: SAMPLE_SOURCE }, ...MORE_SEEDS];
export type SeedRecipe = Seed;
