const values = new Map<string, string>();

const AsyncStorage = {
  setItem: jest.fn(async (key: string, value: string) => {
    values.set(key, value);
  }),
  getItem: jest.fn(async (key: string) => values.get(key) ?? null),
  removeItem: jest.fn(async (key: string) => {
    values.delete(key);
  }),
  __reset: () => values.clear(),
};

export default AsyncStorage;
