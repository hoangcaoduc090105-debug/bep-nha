import type { Seed } from "./shared";
import { VIDEO_SEEDS } from "./video";

/**
 * Recipes loaded once per device: the dishes rewritten from mother's YouTube channels, stored
 * as "entered" ("Mới nhập – chưa nấu thử"). None has been cooked or checked by the family.
 * The ten unverified samples of the first versions are no longer loaded (data/seed/samples.ts).
 */
export const SEED_RECIPES: Seed[] = VIDEO_SEEDS;
export type SeedRecipe = Seed;
