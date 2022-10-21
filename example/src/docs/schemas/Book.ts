export const Book = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      format: 'int64',
      example: 1004,
    },
    title: {
      type: 'string',
      example: 'A Wrinkle in Time',
    },
    author: {
      type: 'string',
      example: "Madeleine L'Engle",
    },
  },
};
