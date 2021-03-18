# esbuild-plugin-stimulus

[esbuild][] plugin for automatically loading [Stimulus][] controllers from a
folder. For example, if you create `controllers/users/list_item_controller.js`,
then your Stimulus controller will be available as `users--list-item`.

[esbuild]: https://esbuild.github.io/
[Stimulus]: https://stimulus.hotwire.dev/

## Install

```shell
npm install --save-dev esbuild-plugin-stimulus
```

## Usage

In your [esbuild script][]:

```javascript
// build.js

const esbuild = require('esbuild');
const { stimulusPlugin } = require('esbuild-plugin-stimulus');

esbuild.build({
  plugins: [stimulusPlugin()],
  // ...
}).catch(() => process.exit(1));
```

And in your application (similar to [using webpack][]):

```javascript
// app.js

import { Application } from 'stimulus';
import { definitions } from 'stimulus:./controllers';

const app = Application.start();
app.load(definitions);
```

If you are using Typescript, add a [declaration file][] like the following to
your project to provide type information for `stimulus:` imports:

```typescript
// esbuild-plugin-stimulus.d.ts

declare module 'stimulus:*' {
  import type { Definition } from 'stimulus';
  export const definitions: Definition[];
}
```

[declaration file]: https://www.typescriptlang.org/docs/handbook/modules.html#working-with-other-javascript-libraries
[esbuild script]: https://esbuild.github.io/getting-started/#build-scripts
[using webpack]: https://stimulus.hotwire.dev/handbook/installing#using-webpack

## License

[Apache 2.0](LICENSE)
