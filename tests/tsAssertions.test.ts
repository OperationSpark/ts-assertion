import fs from 'fs/promises';
import { expect } from 'chai';
import { CodeChecker } from '../src';

type TypeNames =
  | 'StringType'
  | 'NumberType'
  | 'BooleanType'
  | 'EnumType'
  | 'ObjectType';

CodeChecker.config.setGlobalPaths(['tests/global.d.ts']);
// CodeChecker.config.setVerbose(true);

describe('ts-assertions', () => {
  it('should instantiate a CodeChecker instance without a pathname', () => {
    const checker = new CodeChecker();
    expect(checker).to.be.instanceOf(CodeChecker);
    expect(checker).to.have.property('pathname').to.be.empty;

    expect(checker.test('const s: string = "hello";')).to.be.true;
    expect(checker.test('const s: string = 1;')).to.be.false;
  });

  it('should instantiate a CodeChecker instance with a pathname', async () => {
    const pathname = 'tests/fixtures/fixtures1.ts';
    const code = await fs.readFile(pathname, 'utf-8');

    const checker = new CodeChecker<TypeNames>({ pathname });
    expect(checker).to.be.instanceOf(CodeChecker);
    expect(checker).to.have.property('pathname').to.equal(pathname);
    expect(checker).to.have.property('globalTypes').to.be.empty;
    expect(checker).to.have.property('code').to.equal(code);
    expect(checker.types.size).to.be.greaterThan(0);
  });

  it('should parse types when instantiated with a pathname', () => {
    const pathname = 'tests/fixtures/fixtures1.ts';

    const checker = new CodeChecker<TypeNames>({ pathname });

    const types = new Map();

    types.set('StringType', 'export type StringType = string;');
    types.set('NumberType', 'export type NumberType = number;');
    types.set('BooleanType', 'export type BooleanType = boolean;');
    types.set('EnumType', "export type EnumType = 'a' | 'b' | 'c';");
    types.set(
      'ObjectType',
      'export type ObjectType = { a: string; b: number };'
    );
    types.forEach((value, key) => {
      expect(checker.types.get(key)).to.include(value);
    });
  });

  it('should parse types when pathname is updated', () => {
    const initialPathname = 'tests/fixtures/fixtures1.ts';

    const checker = new CodeChecker<TypeNames>({ pathname: initialPathname });

    expect(checker.types.size).to.equal(5);

    const updatedPathname = 'tests/fixtures/fixtures2.ts';

    checker.pathname = updatedPathname;

    expect(checker.types.size).to.equal(1);
  });

  it('should have access to default global types', () => {
    const checker = new CodeChecker();

    expect(checker.test('const err: FILL_ME_IN = new TypeError();')).to.be.true;
    expect(checker.test('const err: FILL_ME_IN = "Invalid";')).to.be.false;
  });

  it('should include globalTypes when set during instantiation', () => {
    const globalTypes = `type SHOULD_HAVE_ACCESS = TypeError;`;
    const checker = new CodeChecker({ globalTypes });
    const expectTrue = 'const err: SHOULD_HAVE_ACCESS = new TypeError();';
    const expectFalse = 'const err: SHOULD_HAVE_ACCESS = "Invalid";';

    expect(checker.globalTypes).to.include(globalTypes);
    expect(checker.test(expectTrue)).to.be.true;
    expect(checker.test(expectFalse)).to.be.false;
  });

  it('should include globalTypes when set after instantiation', () => {
    const checker = new CodeChecker();
    const globalTypes = `type SHOULD_HAVE_ACCESS = TypeError;`;
    checker.globalTypes = globalTypes;
    const expectTrue = 'const err: SHOULD_HAVE_ACCESS = new TypeError();';
    const expectFalse = 'const err: SHOULD_HAVE_ACCESS = "Invalid";';

    expect(checker.globalTypes).to.include(globalTypes);
    expect(checker.test(expectTrue)).to.be.true;
    expect(checker.test(expectFalse)).to.be.false;
  });

  it('should not overwrite default global types when setting globalTypes', () => {
    const checker = new CodeChecker();
    const globalTypes = `type SHOULD_HAVE_ACCESS = TypeError;`;
    checker.globalTypes = globalTypes;

    expect(checker.globalTypes).to.include(globalTypes);

    expect(checker.test('const err: FILL_ME_IN = new TypeError();')).to.be.true;
    expect(checker.test('const err: SHOULD_HAVE_ACCESS = new TypeError();')).to
      .be.true;

    expect(checker.test('const err: FILL_ME_IN = "Invalid";')).to.be.false;
    expect(checker.test('const err: SHOULD_HAVE_ACCESS = "Invalid";')).to.be
      .false;
  });

  it('should "test" code snippets (return boolean)', () => {
    const checker = new CodeChecker();
    expect(checker.test('const str: string = "test";')).to.be.true;
    expect(checker.test('const str: string = 1;')).to.be.false;
  });

  it('should "assert" code snippets (assertions)', () => {
    const checker = new CodeChecker();
    checker.assert('const str: string = "test";').isValid();
    checker.assert('const str: string = 1;').isNotValid();
  });

  it('should allow for updating global types', () => {
    const checker = new CodeChecker();
    checker.globalTypes = `type SHOULD_HAVE_ACCESS = TypeError;`;

    expect(checker.test('const err: SHOULD_HAVE_ACCESS = new TypeError();')).to
      .be.true;
    expect(checker.test('const err: SHOULD_HAVE_ACCESS = "Invalid";')).to.be
      .false;

    checker.globalTypes = `type SHOULD_HAVE_ACCESS = 'Invalid';`;

    expect(checker.test('const err: SHOULD_HAVE_ACCESS = new TypeError();')).to
      .be.false;
    expect(checker.test('const err: SHOULD_HAVE_ACCESS = "Invalid";')).to.be
      .true;
  });

  describe('Code snippets with default types', () => {
    const checker = new CodeChecker<TypeNames>();

    const types: { type: string; validCode: string; invalidCode: string }[] = [
      {
        type: 'string',
        validCode: 'const str: string = "test";',
        invalidCode: 'const str: string = 1;'
      },
      {
        type: 'number',
        validCode: 'const num: number = 1;',
        invalidCode: 'const num: number = "test";'
      },
      {
        type: 'boolean',
        validCode: 'const bool: boolean = true;',
        invalidCode: 'const bool: boolean = 1;'
      }
    ];
    types.forEach(({ type, validCode, invalidCode }) => {
      it(`should test code snippets with custom type '${type}'`, () => {
        expect(checker.test(validCode)).to.be.true;
        expect(checker.test(invalidCode)).to.be.false;
      });
      it(`should assert code snippets with custom type '${type}'`, () => {
        checker.assert(validCode).isValid();
        checker.assert(invalidCode).isNotValid();
      });
    });
  });

  describe('Code snippets with custom types', () => {
    const checker = new CodeChecker<TypeNames>({
      pathname: 'tests/fixtures/fixtures1.ts',
      globalTypes: `type FILL_ME_IN = TypeError;`
    });

    const types: { name: TypeNames; validCode: string; invalidCode: string }[] =
      [
        {
          name: 'StringType',
          validCode: 'const str: StringType = "test";',
          invalidCode: 'const str: StringType = 1;'
        },
        {
          name: 'NumberType',
          validCode: 'const num: NumberType = 1;',
          invalidCode: 'const num: NumberType = "test";'
        },
        {
          name: 'BooleanType',
          validCode: 'const bool: BooleanType = true;',
          invalidCode: 'const bool: BooleanType = 1;'
        },
        {
          name: 'EnumType',
          validCode: 'const enumValue: EnumType = "a";',
          invalidCode: 'const enumValue: EnumType = "d";'
        },
        {
          name: 'ObjectType',
          validCode: 'const obj: ObjectType = { a: "test", b: 1 };',
          invalidCode: 'const obj: ObjectType = { a: 1, b: "test" };'
        }
      ];
    types.forEach(({ name, validCode, invalidCode }) => {
      it(`should test code snippets with custom type '${name}'`, () => {
        expect(checker.test(validCode, name)).to.be.true;
        expect(checker.test(invalidCode, name)).to.be.false;
      });
      it(`should assert code snippets with custom type '${name}'`, () => {
        checker.assert(validCode, name).isValid();
        checker.assert(invalidCode, name).isNotValid();
      });
    });
  });
});
