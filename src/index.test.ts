import * as esbuild from 'esbuild';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';
import { stimulusPlugin } from '.';

let workDir: string;

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-plugin-stimulus-test-'));
});

afterEach(async () => {
  if (workDir) {
    await fs.rm(workDir, {recursive: true});
    workDir = 'bork';
  }
});

const listDefinitions = async (files: Record<string, string>): Promise<Array<{identifier: string, className: string}>> => {
  const entrypointPath = path.join(workDir, 'in.js');
  await fs.writeFile(entrypointPath, `
    import { stdout } from 'process';
    const definitions = require('stimulus:.').definitions.map(({ identifier, controllerConstructor: ctor }) => ({identifier, className: ctor.name}));
    stdout.write(JSON.stringify(definitions));
  `);
  for (const fname in files) {
    if (files.hasOwnProperty(fname)) {
      await fs.writeFile(path.join(workDir, fname), files[fname]);
    }
  }

  const outputFile = path.join(workDir, 'out.js');
  await esbuild.build({
    entryPoints: [entrypointPath],
    outfile: outputFile,
    bundle: true,
    platform: 'node',
    target: 'node14',
    plugins: [stimulusPlugin()],
  });

  return runScript(outputFile);
};

const runScript = async (filename: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, ['--', filename], (error, stdout, _stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(JSON.parse(stdout));
    });
  });
};

test('basic controller', async () => {
  const got = await listDefinitions({
    'foo_controller.js': 'export default class Foo {}',
  });
  expect(got).toEqual([{identifier: 'foo', className: 'Foo'}]);
});

test('underscores', async () => {
  const got = await listDefinitions({
    'foo_bar_controller.js': 'export default class FooBar {}',
  });
  expect(got).toEqual([{identifier: 'foo-bar', className: 'FooBar'}]);
});

test.skip('hyphens', async () => {
  const got = await listDefinitions({
    'foo-bar-controller.js': 'export default class FooBar {}',
  });
  expect(got).toEqual([{identifier: 'foo-bar', className: 'FooBar'}]);
});
