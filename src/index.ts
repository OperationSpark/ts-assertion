import assert from 'assert';
import fsSync from 'fs';
import ts from 'typescript';

type LibVersions =
  | 'esnext'
  | 'es6'
  | 'es5'
  | 'es2023'
  | 'es2022'
  | 'es2021'
  | 'es2020'
  | 'es2019'
  | 'es2018'
  | 'es2017'
  | 'es2016'
  | 'es2015'
  | 'dom';

type CodeCheckerOptions = {
  /** Pathname to input file */
  pathname?: string;
  /**
   * Global types to include during instantiation
   * ```ts
   * options.globalPaths = ['path/to/global.d.ts', ...]
   * ```
   */
  globalPaths?: string[];
  /**
   * Global types to include
   *
   * @example
   * ```ts
   * `type GLOBAL_ACCESS = TypeError;`
   * ```
   */
  globalTypes?: string;
};

type Config = {
  defaultGlobalPaths: string[];
  verbose: boolean;
};

const config: Config = {
  defaultGlobalPaths: [],
  verbose: false
};

/**
 * Test typescript types against a specific block of code
 *
 * @example
 * ```ts
 * // Create a new CodeChecker instance
 * const checker = new CodeChecker({
 *   filepath: 'path/to/input/file'
 * });
 *
 * // Assert that the code is valid; throws an error if the code is *not* valid
 * const isValid = checker.assert(
 *   `const str: string = 'test';`
 * ).isValid();
 *
 * // Assert that the code is not valid; throws an error if the code *is* valid
 * const isNotValid = checker.assert(
 *   `const str: string = 1;`
 * ).isNotValid();
 *
 * // Returns true if the code *is* valid
 * const isValid = checker.test(
 *   `const str: string = 'test';`
 * );
 *
 * // Returns false if the code is *not* valid
 * const isNotValid = checker.test(
 *   `const str: string = 1;`
 * );
 * ```
 */
export class CodeChecker<TypeNames extends string> {
  private _pathname: string;
  private _globalTypes = '';
  private _globalPaths = new Set<string>(config.defaultGlobalPaths);
  private _types = new Map<string, string>();
  private _version: LibVersions = 'es2022';
  private code = '';

  constructor(options: CodeCheckerOptions = {}) {
    const { pathname = '', globalTypes = '', globalPaths = [] } = options;

    this._pathname = pathname;
    this._globalTypes = globalTypes;
    this._globalPaths = new Set([...globalPaths, ...config.defaultGlobalPaths]);

    this.init();
  }

  private init() {
    this.fetchCode();
    this.extractTypesAsStrings();
  }

  private extractTypesAsStrings() {
    this._types.clear();
    const node = ts.createSourceFile(
      'extractTypes.ts', // fileName
      this.code, // sourceText
      ts.ScriptTarget.Latest
    );

    const typeNodes: ts.TypeAliasDeclaration[] = [];

    node.forEachChild(child => {
      if (ts.isTypeAliasDeclaration(child)) {
        typeNodes.push(child);
      }
    });
    const codeBuffer = Buffer.from(this.code);

    typeNodes.forEach((node: ts.TypeAliasDeclaration) => {
      const { pos, end } = node;

      const type = codeBuffer.subarray(pos, end).toString('utf-8');
      this.types.set(node.name.text, type);
    });
  }

  private fetchCode() {
    if (!this.pathname) {
      this.code = '';
      return '';
    }
    try {
      const code = fsSync.readFileSync(this.pathname, 'utf-8');
      this.code = code;
      return code;
    } catch (err) {
      throw new Error(`Cannot read file: '${this.pathname}'`);
    }
  }

  private compileTypeScriptCode(
    filename: string,
    code: string,
    lib: LibVersions
  ): ts.Diagnostic[] {
    const options = ts.getDefaultCompilerOptions();

    const sourceFile = ts.createSourceFile(
      filename,
      code,
      ts.ScriptTarget.Latest
    );

    const host = createVirtualHost(sourceFile);

    const rootName = require.resolve(`typescript/lib/lib.${lib}.d.ts`);

    const program = ts.createProgram(
      [rootName, filename, ...this.globalPaths],
      options,
      host
    );

    const emitResult = program.emit();
    const diagnostics = ts.getPreEmitDiagnostics(program);
    config.verbose && logCodeBlock(sourceFile.getFullText());

    return emitResult.diagnostics.concat(diagnostics);
  }

  private _test(testCode: string, typeName?: TypeNames) {
    const selectedType = typeName && this.types.get(typeName);
    if (typeName && !selectedType) {
      throw new Error(
        `Type '${typeName}' not found in file '${this.pathname}'`
      );
    }

    const code = selectedType ?? this.code;

    /** Initial global types passed in */
    const globalTypes = this.globalTypes ? `${this.globalTypes}\n` : '';

    const messages = this.compileTypeScriptCode(
      'temp.ts',
      `${globalTypes}${code}\n${testCode}`,
      this.version
    ).map(diagnostic =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n\n', 2)
    );

    return {
      valid: !messages.length,
      messages: messages as string[]
    };
  }

  public set pathname(pathname: string) {
    this._pathname = pathname;
    this.init();
  }

  public get pathname() {
    return this._pathname;
  }

  public get types() {
    return this._types;
  }

  public get globalTypes() {
    return this._globalTypes;
  }

  public set globalTypes(types: string) {
    this._globalTypes = types;
  }

  public get globalPaths() {
    return [...this._globalPaths];
  }

  public set globalPaths(paths: string[]) {
    this._globalPaths = new Set([...paths, ...config.defaultGlobalPaths]);
  }

  public get version() {
    return this._version;
  }

  public set version(version: LibVersions) {
    this._version = version;
  }

  public restore(pathname?: string) {
    this.pathname = pathname ?? this.pathname;

    this.init();
  }

  public test(testCode: string, typeName?: TypeNames) {
    const { valid } = this._test(testCode, typeName);

    return valid;
  }

  public assert(testCode: string, typeName?: TypeNames) {
    const { valid, messages } = this._test(testCode, typeName);

    return {
      isValid: (msg?: string) => {
        assert(
          valid,
          new TypeError([...messages, msg].filter(Boolean).join('\n'))
        );
      },
      isNotValid: (msg?: string) => {
        assert(
          !valid,
          `Expected code '${testCode}' to be invalid${
            msg ? `\n  - ${msg}` : ''
          }`
        );
      }
    };
  }
  public static get config() {
    return {
      setGlobalPaths: (paths: string[]) => {
        config.defaultGlobalPaths = paths;
      },
      setVerbose: (verbose: boolean) => {
        config.verbose = verbose;
      },
      get current() {
        return { ...config };
      }
    };
  }
}

/** Create typescript compiler host to interpret code 'in-memory' instead of writing file */
function createVirtualHost(sourceFile: ts.SourceFile) {
  const filename = 'temp.ts';
  const options = ts.getDefaultCompilerOptions();
  const realHost = ts.createCompilerHost(options, true);

  const host: ts.CompilerHost = {
    fileExists: filePath =>
      filePath === filename || realHost.fileExists(filePath),
    directoryExists: realHost.directoryExists?.bind(realHost),
    getCurrentDirectory: realHost.getCurrentDirectory.bind(realHost),
    getDirectories: realHost.getDirectories?.bind(realHost),
    getCanonicalFileName: realHost.getCanonicalFileName.bind(realHost),
    getNewLine: realHost.getNewLine.bind(realHost),
    getDefaultLibFileName: realHost.getDefaultLibFileName.bind(realHost),
    getSourceFile: (sourceFilename, ...args) => {
      if (sourceFilename === filename) {
        return sourceFile;
      }
      return realHost.getSourceFile(sourceFilename, ...args);
    },
    readFile: filePath => {
      if (filePath === filename) {
        return sourceFile.text;
      }
      realHost.readFile(filePath);
    },
    useCaseSensitiveFileNames: () => realHost.useCaseSensitiveFileNames(),
    writeFile: (_fileName, _data) => {
      /** Optionally do something with compiled code here */
    }
  };

  return host;
}

function logCodeBlock(text: string) {
  if (!text) {
    return;
  }
  let longestLine = 0;

  const formatted = text
    .split('\n')
    .map((line, index) => {
      if (line.length > longestLine) {
        longestLine = line.length;
      }

      return `${index + 1} │ ${line}`;
    })
    .join('\n');

  const line = '─'.repeat(longestLine + 3);
  const topLine = `┬${line}`.padStart(longestLine + 6, '─');
  const bottomLine = `┴${line}`.padStart(longestLine + 6, '─');

  console.info(`${topLine}\n${formatted}\n${bottomLine}`);
}
