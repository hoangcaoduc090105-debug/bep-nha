// Domain types for Bếp Nhà. Everything here is stored on the device (IndexedDB).
// See DATABASE_SCHEMA.md.

export type Unit =
  | "g" | "kg" | "ml" | "l"
  | "muong_ca_phe" | "muong_canh" | "chen"
  | "trai" | "cu" | "tep" | "nhanh" | "cay" | "la" | "lat" | "con" | "qua" | "mieng" | "bo" | "hop"
  | "it";

export type TasteRole = "sweet" | "salty" | "spicy" | "sour" | "rich";

export type Ingredient = {
  /** Stable key inside the recipe; step text refers to it as {slot}. */
  slot: string;
  name: string;
  kind: "food" | "seasoning";
  /** Heading it is listed under, e.g. "Nguyên liệu", "Gia vị ướp cá". */
  group: string;
  quantity: number | null;
  unit: Unit | null;
  metricQuantity: number | null;
  metricUnit: "g" | "ml" | null;
  optional?: boolean;
  /** false = does not grow with the number of servings (e.g. "1 nồi nước"). */
  scales?: boolean;
  prepNote?: string;
  tasteRole?: TasteRole;
};

export type StepUse = { slot: string; portion: number };

export type Step = {
  no: number;
  phase: "prep" | "cook" | "finish";
  title: string;
  /** Sub-instructions. Quantities are written as {slot} tokens, never as fixed numbers. */
  instructions: string[];
  /** What to see, smell or hear when the step is done. */
  doneWhen?: string;
  /** The usual mistake at this step. */
  avoid?: string;
  ifWrong?: string;
  timerSeconds?: number;
  timerLabel?: string;
  heat?: "low" | "medium" | "high" | "off";
  uses: StepUse[];
  /** Where this step is shown in the source video, in seconds from its start. */
  videoStartSeconds?: number;
  videoEndSeconds?: number;
  /** In that part of the video the channel does not say the amounts this step uses. */
  videoOmitsAmounts?: boolean;
};

export type Equipment = { name: string; kind: "appliance" | "utensil"; required: boolean; alternative?: string };

export type RecipeSource = {
  kind: "youtube" | "website" | "book" | "family" | "sample";
  title: string;
  creatorName?: string;
  url?: string;
  youtubeVideoId?: string;
  /**
   * The part of the video where the channel lists the ingredients and their amounts, in seconds
   * from its start. Shown on the "Chuẩn bị nguyên liệu" screen, before step 1.
   */
  ingredientsVideoStartSeconds?: number;
  ingredientsVideoEndSeconds?: number;
  /** How faithfully the written recipe follows the source. */
  fidelity: "exact" | "transcribed" | "inspired" | "own";
  note?: string;
};

/**
 * sample = written for the app, never cooked · entered = typed in by the family (or received
 * in a recipe pack), not yet cooked in the app · family_approved = confirmed after a good meal.
 */
export type Verification = "sample" | "entered" | "source_checked" | "family_approved";

export type Recipe = {
  id: string;
  name: string;
  /** Lower case, no diacritics — for search. */
  searchName: string;
  description: string;
  imageId: string | null;
  categories: string[];
  source: RecipeSource;
  difficulty: "easy" | "medium" | "hard";
  originalVersionId: string;
  /** The version the family prefers; null = cook the original. */
  familyVersionId: string | null;
  verification: Verification;
  isArchived: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

/** A complete, self-contained snapshot. Never edited once it has been cooked. */
export type RecipeVersion = {
  id: string;
  recipeId: string;
  kind: "original" | "family";
  versionNo: number;
  label?: string;
  parentVersionId: string | null;
  changeReason?: string;
  fromSessionId?: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  notes?: string;
  tasteTips?: string;
  ingredients: Ingredient[];
  steps: Step[];
  equipment: Equipment[];
  createdAt: string;
};

export type Verdict = "rat_ngon" | "vua_mieng" | "hoi_man" | "hoi_ngot" | "chua_ngon";

export type SessionTimer = { id: string; label: string; stepNo: number; durationSeconds: number; endsAt: number | null; remainingSeconds: number | null };

export type CookingSession = {
  id: string;
  recipeId: string;
  /** The exact version cooked. Keeps the journal truthful when the recipe changes later. */
  versionId: string;
  servings: number;
  status: "in_progress" | "completed" | "abandoned";
  /** 0 = the "Chuẩn bị" checklist; 1..n = steps. */
  currentStep: number;
  /** Ingredient slots ticked off. */
  checked: string[];
  timers: SessionTimer[];
  /** What was really used when it differed from the version. */
  adjustments: Array<{ slot: string; actualQuantity: number; note?: string }>;
  feedback: { verdict: Verdict; note?: string } | null;
  photoIds: string[];
  startedAt: string;
  finishedAt: string | null;
};

export type StoredImage = { id: string; blob: Blob; createdAt: string };

export type Setting = { key: string; value: unknown };

/** The data as it was just before a restore or import, kept on the device so it can be undone. */
export type RestorePoint = { id: string; createdAt: string; reason: string; bytes: Uint8Array };

// ───────────── the recipe editor ─────────────

export type FormIngredient = {
  slot: string;
  name: string;
  kind: "food" | "seasoning";
  /** null together with unit "it" means "một ít, vừa ăn". */
  quantity: number | null;
  unit: Unit | null;
  prepNote: string;
  optional: boolean;
};

export type FormStep = {
  /** Stable key for the list on screen; not stored in the recipe. */
  key: string;
  title: string;
  /** One instruction per line. Ingredients are written as {slot} tokens. */
  text: string;
  doneWhen: string;
  avoid: string;
  timerMinutes: number | null;
  timerLabel: string;
  heat: Step["heat"] | null;
};

export type FormSourceKind = "family" | "youtube" | "other";

/** What the editor works on. It may be incomplete; it only becomes a recipe when it passes validation. */
export type RecipeForm = {
  name: string;
  description: string;
  categories: string[];
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  imageId: string | null;
  ingredients: FormIngredient[];
  equipment: Equipment[];
  steps: FormStep[];
  sourceKind: FormSourceKind;
  sourceTitle: string;
  sourceCreator: string;
  sourceUrl: string;
  sourceNote: string;
  notes: string;
  tasteTips: string;
};

/** Work in progress in the editor, saved after every change. id = "new" or the recipe being edited. */
export type Draft = { id: string; form: RecipeForm; baseVersionId: string | null; updatedAt: string };
