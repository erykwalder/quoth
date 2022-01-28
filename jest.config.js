// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jestSetup.ts"],
  modulePathIgnorePatterns: ["./data.json"],
};
