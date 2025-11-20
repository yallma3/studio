import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const repoUrl = "https://github.com/yallma3/yallma3-core.git";
const coreDir = path.resolve(".yallma3-core"); // cloned here temporarily
const outputDir = path.resolve("src-tauri/bin");
const outputFile = path.join(outputDir, "server");

if (!fs.existsSync(coreDir)) {
  console.log("Cloning yallma3-core...");
  execSync(`git clone ${repoUrl} ${coreDir}`, { stdio: "inherit" });
} else {
  console.log("Updating yallma3-core...");
  execSync(`cd ${coreDir} && git pull`, { stdio: "inherit" });
}

console.log("Installing yallma3-core dependencies with Bun...");
execSync(`cd ${coreDir} && bun install`, { stdio: "inherit" });

console.log("Building yallma3-core with Bun...");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

execSync(`bun build ${coreDir}/index.ts --compile --outfile ${outputFile}`, {
  stdio: "inherit",
});

console.log(`Built yallma3-core -> ${outputFile}`);

console.log("Cleaning up temporary clone...");
await fs.promises.rm(coreDir, { recursive: true, force: true });

console.log("yallma3-core built and embedded.");
