const todoList = () => {
  const all = [];
  const add = (todoItem) => {
    all.push(todoItem);
  };
  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const fDate = () => new Date().toLocaleDateString("en-CA");
  const overdue = () => {
    // Write the date check condition here and return the array of overdue items accordingly.
    return all.filter((item) => item.dueDate < fDate());
  };

  const dueToday = () => {
    // Write the date check condition here and return the array of todo items that are due today accordingly.
    return all.filter((item) => item.dueDate === fDate());
  };

  const dueLater = () => {
    // Write the date check condition here and return the array of todo items that are due later accordingly.
    return all.filter((item) => item.dueDate > fDate());
  };

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
  };
};

module.exports = todoList;