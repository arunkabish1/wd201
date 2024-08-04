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
    
    return all.filter((item) => item.dueDate < fDate());
  };

  const dueToday = () => {
    // due today should be completed
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