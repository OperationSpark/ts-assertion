# Assertion library for testing types

This library provides assertions for testing types

## Installation

```sh
npm install -D @operationspark.org/ts-assertion
```

## Usage

### `CodeCheckerOptions`

| Name          | Description                        |            |
| ------------- | ---------------------------------- | ---------- |
| `pathname`    | Pathname to input file             | `Optional` |
| `globalTypes` | string of globally available types | `Optional` |
| `globalPaths` | string of globally available paths | `Optional` |

### `CodeChecker` Methods

| Name     | Description                                                    | Returns |
| -------- | -------------------------------------------------------------- | ------- |
| `test`   | Test the code string and return a boolean if the code is valid | boolean |
| `assert` | Test the code string. Chain `isValid()` or `isNotValid()`      | void    |

### `CodeChecker` global config

Set global configurations for all instances of `CodeChecker`

```ts
import { CodeChecker } from '@operationspark.org/ts-assertion';

CodeChecker.config.setGlobalPaths([
  'path/to/file.ts',
  'path/to/other/file.d.ts'
]); // default is []
CodeChecker.config.setVerbose(true); // default: false
```

### Basic Usage (No Options)

```ts
import { CodeChecker } from '@operationspark.org/ts-assertion';

const checker = new CodeChecker();

// Test returns boolean. `true` if the code is valid
checker.test('const str: string = "test";'); // true
checker.test('const str: string = 1;'); // false

// Assert throws an error if the code is not valid
checker.assert('const str: string = "test";').isValid();

// Assert throws an error if the code is valid
checker.assert('const str: string = 1;').isNotValid();
```

### Advanced Usage (With Options)

> `path/to/file.ts`
>
> ```ts
> export type StringType = string;
> export type NumberType = number;
> export type BooleanType = boolean;
> ```

```ts
import { CodeChecker } from '@operationspark.org/ts-assertion';

const options:  = {
  pathname: 'path/to/file.ts',
  globalTypes: 'type PrimitiveType = string | number | boolean;',
  globalPaths: ['path/to/file.ts', 'path/to/other/file.d.ts'],
};
type TypeNames = 'StringType' | 'NumberType' | 'BooleanType';
const checker = new CodeChecker<TypeNames>(options);


// Test returns boolean. `true` if the code is valid
checker.test('const str: StringType = "test";') // true
checker.test('const str: string = 1;') // false

// Assert throws an error if the code is not valid/invalid
checker.assert('const str: StringType = "test";').isValid();
checker.assert('const str: string = 1;').isNotValid();

// Or more specifically, just test the type in the file
checker.test(
  'const str: StringType = "test";',
  'StringType'
) // true
checker.assert(
  'const str: StringType = "test";', 'StringType'
).isValid();
```

## Development

### Setup

```sh
npm install
```

### Test

```sh
npm test
```

#### Watch

```sh
npm run test:dev
```

### Publish

```sh
npm run publish:npm
```
