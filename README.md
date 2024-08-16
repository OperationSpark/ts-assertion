# Assertion library for testing types

This library provides assertions for testing types

## Installation

```sh
npm install -D @operationspark.org/ts-assertion
```

## Usage

### `CodeCheckerOptions`

| Name          | Description                        | Optional |
| ------------- | ---------------------------------- | -------- |
| `pathname`    | Pathname to input file             | true     |
| `globalTypes` | string of globally available types | true     |

```ts
// Without file
import { CodeChecker } from '@operationspark.org/ts-assertion';

const checker = new CodeChecker();

expect(checker.test('const str: string = "test";')).to.be.true;
expect(checker.test('const str: string = 1;')).to.be.false;

checker.assert('const str: string = "test";').isValid();
checker.assert('const str: string = 1;').isNotValid();
```

```ts
import { CodeChecker } from '@operationspark.org/ts-assertion';

const options:  = {
  pathname: 'path/to/file.ts',
  globalTypes: 'type PrimitiveType = string | number | boolean;',
};
type TypeNames = 'StringType' | 'NumberType' | 'BooleanType' | 'EnumType';
const checker = new CodeChecker<TypeNames>(options);

// file.ts
/*
export type StringType = string;
export type NumberType = number;
export type BooleanType = boolean;
export type EnumType = 'a' | 'b' | 'c';
*/

// Test returns true if the code is valid
expect(checker.test('const str: StringType = "test";')).to.be.true;
expect(checker.test('const str: string = 1;')).to.be.false;

// Assert throws an error if the code is not valid/invalid
checker.assert('const str: StringType = "test";').isValid();
checker.assert('const str: string = 1;').isNotValid();

// Or more specifically, just test the type in the file
expect(checker.test('const str: StringType = "test";'), 'StringType').to.be.true;
checker.assert('const str: StringType = "test";', 'StringType').isValid();
```
