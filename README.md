# Nestjs-yalc library

This is the layer of the nestjs-yalc libraries which are distributed
open-source under the AGPL3 license

Nest-yalc stands for Nstjs - Yet Another Library Collection

## NPM package.json and Workspace

To handle scripts and dependencies between all the libraries of this collection we use a root `package.json`.
At the moment it handles both the `devDependencies` needed to run the tests and the build process, as well as the
dependencies of the libraries itself.

The [npm workspace](https://docs.npmjs.com/cli/v7/using-npm/workspaces) approach must be preferred by the way. It allows us to
specify the dependencies and some scripts directly inside the package itself but still having the possibility of managing them
from the root `package.json`. (see aws-sdk library for example)

## Unit tests

The main `package.json` contain some scripts to run the unit test for all the libraries of this collection.
It uses the jest `projects` feature in background configured by `jest.config.ts` by using a customized mechanism
implemented in our `@nest-yalc/jest` library.

To run the tests with the coverage use `npm run test:cov` and then you can check the status of the tests by running `npm run test:cov:serve`
Then you should be able to browse the coverage reports via: [http://127.0.0.1:8080/lcov-report/](http://127.0.0.1:8080/lcov-report/)

## Pipeline

Currently our github pipeline checks that the linter and the tests are passing with 100% of coverage threshold
