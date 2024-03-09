export interface SingleKeySchema {
  parent?: string;
  prop: string;
  type: string;
  oneOf?: string[];
  required?: boolean;
  parse?: (value: any) => any;
}

export interface SchemaType {
  [key: string]: SingleKeySchema;
}

export interface DataWithError {
  [key: string]: {
    value: any;
    error?: string;
  };
}

export interface ParsedData {
  [key: string]: any;
}

export interface ErrorData {
  index: number;
  key: string;
  error: string;
}

interface parseDataProps {
  dataWithErrors: DataWithError[];
  parsedData: ParsedData[];
  errors: ErrorData[];
}

const validateAndParse = (
  key: string,
  value: any,
  schema: SingleKeySchema
): { [key: string]: { value: any; error?: string } } => {
  try {
    const parsedValue = schema?.parse?.(value) ?? value;
    const expectedType = schema?.type;

    if (
      (parsedValue === undefined || parsedValue === null) &&
      !schema?.required
    ) {
      return { [key]: { value: parsedValue } };
    }

    if (typeof parsedValue !== expectedType && expectedType !== "any") {
      return {
        [key]: {
          value: parsedValue,
          error: `${key} should be of type ${expectedType}`,
        },
      };
    }

    if (schema?.oneOf && !schema?.oneOf.includes(parsedValue)) {
      return {
        [key]: {
          value: parsedValue,
          error: `${key} should be one of the ${schema?.oneOf}`,
        },
      };
    }

    if (
      schema?.required &&
      (parsedValue === undefined || parsedValue === null)
    ) {
      return {
        [key]: { value: parsedValue, error: `${key} is required` },
      };
    }

    return { [key]: { value: parsedValue } };
  } catch (error) {
    return { [key]: { value, error: error.message } };
  }
};

const parseDataWithSchema = (
  data: any[],
  schema: SchemaType
): parseDataProps => {
  const errors: ErrorData[] = [];
  const parsedData: ParsedData[] = [];
  const dataWithErrors: DataWithError[] = data.map((item, index) => {
    return Object.keys(schema).reduce((acc, key) => {
      const {
        [key]: { value, error },
      } = validateAndParse(key, item[key], schema[key]);
      const parsedRow = { [schema[key].prop]: value };
      if (error) {
        errors.push({ index, key, error });
      }
      const prop = schema[key].prop || key;

      if (schema[key].parent) {
        const indexKey = schema[key].parent || key;
        acc[indexKey] = acc[indexKey] || {};
        acc[indexKey][prop] = { value, error };

        if (!parsedData[index]) {
          parsedData[index] = {};
        }

        parsedData[index][indexKey] = {
          ...(parsedData[index][indexKey] || {}),
          [prop]: value,
        };
      } else {
        acc[prop] = { value, error };

        if (!parsedData[index]) {
          parsedData[index] = {};
        }

        parsedData[index] = { ...parsedData[index], ...parsedRow };
      }

      return acc;
    }, {} as ParsedData);
  });

  return { dataWithErrors, parsedData, errors };
};

const schemaParser = (
  dataArray: any[],
  schema: SchemaType
): parseDataProps & { ParsedDataWithOutErrors: ParsedData[] } => {
  const { dataWithErrors, parsedData, errors } = parseDataWithSchema(
    dataArray,
    schema
  );

  const ParsedDataWithOutErrors = parsedData.filter((item, index) => {
    return !Object.values(dataWithErrors[index]).some((item) => item.error);
  });

  return {
    dataWithErrors,
    parsedData,
    ParsedDataWithOutErrors,
    errors,
  };
};

export default schemaParser;
