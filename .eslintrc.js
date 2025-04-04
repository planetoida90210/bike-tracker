module.exports = {
  root: true,
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ["@babel/preset-react"],
    },
  },
  extends: ["react-app"],
  rules: {
    "no-restricted-globals": "off",
  },
};
