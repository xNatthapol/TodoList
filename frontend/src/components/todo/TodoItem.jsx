import React from "react";

const TodoItem = ({ todo, onViewEditClick }) => {
  const statusClasses = {
    Pending: "bg-white border-gray-300 hover:bg-gray-50",
    "In Progress": "bg-yellow-50 border-yellow-400 hover:bg-yellow-100",
    Done: "bg-green-100 border-green-400 text-gray-500 hover:bg-green-200",
  };
  const itemClasses = `border rounded-lg p-4 mb-3 shadow-sm transition-colors duration-200 cursor-pointer ${statusClasses[todo.status] || statusClasses["Pending"]}`;
  const titleClasses = `text-lg font-semibold ${todo.status === "Done" ? "line-through text-gray-500" : "text-gray-900"}`;
  const statusIndicatorClasses = `w-3 h-3 rounded-full ml-auto ${
    todo.status === "Done"
      ? "bg-green-500"
      : todo.status === "In Progress"
        ? "bg-yellow-500"
        : "bg-gray-400"
  }`;

  const handleClick = () => {
    onViewEditClick(todo);
  };

  return (
    <div
      className={itemClasses}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <h4 className={titleClasses}>{todo.title}</h4>
        <span
          className={statusIndicatorClasses}
          title={`Status: ${todo.status}`}
        ></span>
      </div>
    </div>
  );
};

export default TodoItem;
