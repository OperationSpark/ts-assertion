export type ComplexObject = {
  a: string;
  b: number;
  c: boolean;
  d: string[];
  e: number[];
  f: boolean[];
  g: { a: string; b: number };
  h: { a: string; b: number }[];
  i: (a: number, b: number) => number;
  j: Map<string, number>;
  k: Set<number>;
  l: Date;
};
