import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
            }
        },
        files: [ 'src/**/*.ts', 'test/**/*.ts' ],
        rules: {
            "no-inner-declarations": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/ban-ts-comment" : "off",
            "@typescript-eslint/no-inferrable-types" : "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "array-callback-return": "error",
            "consistent-return": "error",
            "eqeqeq": "error",
            "no-eval": "error",
            "no-fallthrough": "error",
            "no-mixed-spaces-and-tabs": "error",
            "no-undef": "error",
            "no-unreachable": "error",
            "no-var": "error",
            "prefer-const": "error",
            "semi": "error",
        },

    },
];
