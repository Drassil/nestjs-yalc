/**
 * This file is only used to remove the --findRelatedTests
 * from the vs-code internal command in order to properly collect
 * the coverage
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import cp from "child_process";

const newArgs = process.argv.slice(2).filter((p) => p !== "--findRelatedTests");

var command = "NODE_OPTIONS=--experimental-vm-modules jest";

cp.spawnSync(command, newArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: [process.stdin, process.stdout, process.stderr],
  encoding: "utf-8"
});
