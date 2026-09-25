import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import security from "eslint-plugin-security";
import prettierConfig from "eslint-config-prettier";

/**
 * Feature-slice import boundaries: a feature may only be imported from
 * outside via its public `index.ts`. Cross-feature reach-ins are banned so
 * each slice stays independently testable and replaceable.
 */
const featureNames = ["ingest", "clauses", "risk", "compare", "qa", "actions", "safety"];

const featureBoundaryRules = featureNames.map((name) => ({
  target: `./src/features/!(${name})/**/*`,
  from: `./src/features/${name}/**/*`,
  except: [`./src/features/${name}/index.ts`, `./src/features/${name}/index.tsx`],
  message: `Import from "@/features/${name}" (its public index), not a deep path into the feature.`,
}));

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "public/vendor/**",
  ]),
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Root-level tooling config files aren't part of the app's
          // tsconfig `include`; lint them without type-aware rules rather
          // than widening the tsconfig to cover build tooling.
          allowDefaultProject: ["*.config.mjs", "scripts/*.mjs"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // "import" and "jsx-a11y" are already registered as plugins by
    // eslint-config-next above; only their *rule sets* are merged in here
    // to avoid a "Cannot redefine plugin" config error. "security" is new.
    plugins: { security },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      ...security.configs.recommended.rules,

      // --- Code quality gates (Code Quality axis) ---
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true },
      ],
      complexity: ["error", 8],
      "max-lines-per-function": [
        "error",
        { max: 40, skipBlankLines: true, skipComments: true },
      ],
      "max-lines": ["error", { max: 250, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 3],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "Prefer a union of string literals or `as const` object over `enum`.",
        },
      ],

      // --- Feature-slice boundaries ---
      "import/no-restricted-paths": [
        "error",
        {
          zones: featureBoundaryRules,
        },
      ],
    },
  },
  {
    // React components' return type (JSX.Element) is unambiguous from the
    // `return (<jsx/>)` body; requiring an explicit annotation on every
    // component is noise the rule earns its keep on in `lib/` instead.
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    // Config/tooling files run outside the app's tsconfig program
    // (see allowDefaultProject above), so type-aware rules have no type
    // information to check against here; disable them for these files
    // rather than widening the app's tsconfig to cover build tooling.
    files: ["*.config.mjs", "scripts/*.mjs"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      // Plain JS has no type annotation syntax to add here.
      "@typescript-eslint/explicit-function-return-type": "off",
      // A CLI script's entire job is stdout/stderr output.
      "no-console": "off",
    },
  },
  {
    // Test files and worker entry points may exceed app-code strictness
    // where a table-driven test or a long fixture makes that reasonable.
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx", "tests/**"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // vi.fn()/expect.any()/mocked module factories are untyped (`any`)
      // by design in Vitest; the fixtures they stand in for are typed
      // everywhere they're actually used in application code.
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      // Fixture paths are built from a fixed `tests/fixtures` root plus a
      // filename literal at each call site, never user/network input.
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  prettierConfig,
]);

export default eslintConfig;
