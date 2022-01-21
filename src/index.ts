/**
 * @license
 * Copyright 2021 The esbuild-plugin-stimulus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Plugin } from 'esbuild';
import * as path from 'path';
import { readdir } from 'fs';
import { promisify } from 'util';

const CONTROLLER_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
];

const CONTROLLER_SUFFIXES = [
  '-controller',
  '_controller',
];

interface ParsedControllerName {
  controller: string;
  module: string;
}

function parseControllerName(filename: string): ParsedControllerName | null {
  let base: string | undefined;
  for (let ext of CONTROLLER_EXTENSIONS) {
    if (filename.endsWith(ext)) {
      base = filename.substring(0, filename.length - ext.length);
      break;
    }
  }
  if (base === undefined) {
    return null;
  }
  for (let suffix of CONTROLLER_SUFFIXES) {
    if (base.endsWith(suffix)) {
      return {
        controller: base.substring(0, base.length - suffix.length).replace(/_/g, '-'),
        module: base,
      };
    }
  }
  return null;
}

export const stimulusPlugin = (): Plugin => ({
  name: 'stimulus',
  setup(build) {
    const namespace = 'stimulus_ns';

    build.onResolve({ filter: /^stimulus:./ }, args => {
      const pathArg = args.path.substring('stimulus:'.length);
      return {
        path: path.join(args.resolveDir, pathArg.replace(/\//g, path.sep)),
        namespace,
      };
    });

    build.onLoad({ filter: /.*/, namespace }, async (args) => {
      interface Controller {
        controllerName: string;
        modulePath: string;
      }
      const walk = async (dir: string, prefix: string, moduleDir: string): Promise<Controller[]> => {
        let files;
        try {
          files = await promisify(readdir)(dir, {withFileTypes: true});
        } catch {
          // Does not exist. Return empty list.
          return [];
        }
        let result = [];
        for (const ent of files) {
          if (ent.isDirectory()) {
            result.push(...await walk(
              path.join(dir, ent.name),
              prefix + ent.name.replace(/_/g, '-') + '--',
              moduleDir + '/' + ent.name,
            ));
            continue;
          }
          const parseResult = parseControllerName(ent.name);
          if (parseResult) {
            result.push({
              controllerName: prefix + parseResult.controller,
              modulePath: moduleDir + '/' + parseResult.module,
            });
          }
        }
        return result;
      };
      const controllers = await walk(args.path, '', '.');
      let contents = '';
      for (let i = 0; i < controllers.length; i++) {
        const { modulePath } = controllers[i];
        contents += `import c${i} from '${modulePath}';\n`;
      }
      contents += 'export const definitions = [\n';
      for (let i = 0; i < controllers.length; i++) {
        const { controllerName } = controllers[i];
        contents += `\t{identifier: '${controllerName}', controllerConstructor: c${i}},\n`;
      }
      contents += '];\n';
      return {
        contents,
        loader: 'js',
        resolveDir: args.path,
      };
    });
  },
});
