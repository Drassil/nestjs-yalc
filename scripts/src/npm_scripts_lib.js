const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const script = process.argv.slice(2);
console.log('script: ', script[0]);

const run = (...commands) =>
  commands.forEach((command) => {
    try {
      console.debug('RUN: ' + command);
      execSync(command, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '../'),
      });
    } catch (e) {
      // console.error(e);
      process.exit(1);
    }
  });

/**
 *
 * @param {*} source
 * @returns {string[]}
 */
const listDirectories = (source) =>
  fs
    .readdirSync(source, {
      withFileTypes: true,
    })
    .reduce((a, c) => {
      c.isDirectory() && a.push(c.name);
      return a;
    }, []);

/**
 *
 * @param {string[]} skip
 */
const installDeps = (skip) => () => {
  const projectsPath = path.resolve(`${__dirname}/../projects`);

  const directories = listDirectories(projectsPath);

  run.apply(
    null,
    directories
      .filter((d) => !skip.includes(d))
      .map((d) => {
        if (fs.existsSync(`${projectsPath}/${d}/yarn.lock`)) {
          return `yarn --cwd ${projectsPath}/${d} install`;
        }

        return `npm install  --prefix ${projectsPath}/${d}  --engine-strict`;
      }),
  );
};

// Function to check for Debian-based system
function isDebianBased() {
  try {
    // Check if the platform is Linux
    if (os.platform() !== 'linux') {
      console.log('Not running on Linux');
      return false;
    }

    // Check for APT
    execSync('which apt');
    console.log('Debian-based system with APT found');
    return true;
  } catch (error) {
    console.log('Not a Debian-based system or APT not found');
    return false;
  }
}

const gitSubmoduleSetup = () => {
  run(
    'git submodule update --init --recursive && git submodule update --recursive && git submodule sync',
  );
};

const gitConfigSetup = () => {
  run(
    'git config --global submodule.recurse true',
    'git config --global core.autocrlf input',
    'git config --global fetch.prune true',
  );
};

module.exports = {
  gitSubmoduleSetup,
  gitConfigSetup,
  run,
  listDirectories,
  installDeps,
  isDebianBased,
  script: script[0],
};
