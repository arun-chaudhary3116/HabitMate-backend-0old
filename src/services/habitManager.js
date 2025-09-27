let currentHabit = null;

export const createHabit = (habit) => {
  currentHabit = habit;
  return currentHabit;
};

export const deleteHabit = () => {
  const deleted = currentHabit;
  currentHabit = null;
  return deleted;
};

export const getHabit = () => currentHabit;
