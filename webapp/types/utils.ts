// Define a generic dictionary type with string keys 
// and values of type T (defaulting to any)
export type Dict<T = any> = { [key: string]: T };

export interface ComponentData {
  startupParameters: Dict<string>;
}

// The type can be one of my predefined words OR any other string 
// — and don’t break IntelliSense.
export type LiteralUnion<T, U extends string = string> = T | (U & Record<never, never>);
