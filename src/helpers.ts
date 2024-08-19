export type CodeType =
  | string
  | number
  | boolean
  | null
  | Date
  | RegExp
  | Set<any>
  | Map<any, any>
  | Error
  | any[]
  | Record<string, any>;

const getIndentStr = (indent: number) => ' '.repeat(indent);

const arrToString = (arr: CodeType[], indent: number) => {
  const indentStr = getIndentStr(indent + 2);
  const array = arr.map<string>(
    value => `${indentStr}${codeToString(value, indent + 4)}`
  );
  if (arr.length === 0) {
    return '[]';
  }

  if (arr.length <= 3 && typeof arr[0] !== 'object') {
    return `[ ${array.map(v => v.trim()).join(', ')} ]`;
  }

  return `[\n${array.join(',\n')}\n${indentStr.slice(2)}]`;
};

const objToString = (obj: Record<string, CodeType>, indent: number) => {
  const indentStr = getIndentStr(indent + 2);
  const entries = Object.entries(obj);
  const object = entries.map<string>(
    ([key, value]): string =>
      `${indentStr}${key}: ${codeToString(value, indent + 2)}`
  );

  if (entries.length === 0) {
    return '{}';
  }

  if (entries.length <= 3) {
    return `{ ${object.map(v => v.trim()).join(', ')} }`;
  }

  return `{\n${object.join(',\n')}\n${indentStr.slice(2)}}`;
};

const mapToString = (map: Map<any, any>, indent: number) => {
  const indentStr = getIndentStr(indent + 2);
  const endIndentStr = indentStr.slice(2);
  const entries = [...map.entries()]
    .map(([key, value]) => {
      const k = codeToString(key, indent);
      const v = codeToString(value, indent);
      return `${indentStr}[${k}, ${v}]`;
    })
    .join(',\n');
  return `new Map([\n${entries}\n${endIndentStr}])`;
};

const setToString = (set: Set<CodeType>, indent: number) => {
  return `new Set(${arrToString([...set], indent)})`;
};

const errorToString = (err: Error) => {
  return `new ${err.name}('${err.message}')`;
};

const codeToString = (code: CodeType, indent?: number): string => {
  if (typeof code === 'number' || typeof code === 'boolean' || code === null) {
    return `${code}`;
  }

  if (typeof code === 'string') {
    return `'${code}'`;
  }

  if (typeof code === 'function') {
    return code.toString();
  }

  if (code instanceof Date) {
    return `new Date('${code.toISOString()}')`;
  }

  if (code instanceof RegExp) {
    return code.toString();
  }

  if (code instanceof Set) {
    return setToString(code, indent ?? 0);
  }

  if (code instanceof Map) {
    return mapToString(code, indent ?? 0);
  }

  if (code instanceof Error) {
    return errorToString(code);
  }

  if (Array.isArray(code)) {
    return arrToString(code, indent ?? 0);
  }

  if (typeof code === 'object') {
    return objToString(code, indent ?? 0);
  }

  return code;
};

export const toTypedString = (
  code: any,
  name: string,
  typeName: string
): string => {
  const object = codeToString(code);
  return `const ${name}: ${typeName} = ${object};`;
};

export const toJsString = (code: CodeType): string => {
  return codeToString(code);
};
