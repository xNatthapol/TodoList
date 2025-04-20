import React from "react";
import TodoItem from "./TodoItem";

const TodoList = ({ todos, onViewEditClick }) => {
  if (!todos || todos.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-6">No todos yet. Add one!</p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onViewEditClick={onViewEditClick} />
      ))}
    </div>
  );
};

export default TodoList;
