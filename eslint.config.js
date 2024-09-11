export default [
    {
        globals: {
            "artifacts": true,
            "contract": true,
            "web3": true,
            "assert": true,
            "it": true,
            "before": true,
            "beforeEach": true,
            "describe": true
        },
        rules: {
            "strict": 0,
            "indent": ["error", 4],
            "func-names": "off",
            "max-len": "off",
            "no-underscore-dangle": "off"
        },
        ignores: ["tmp/*", "build/*", "node_modules/*", "contracts/*"]
    }
]

