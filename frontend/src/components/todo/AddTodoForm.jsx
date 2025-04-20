import React, { useState } from "react";

const AddTodoForm = ({ onAddTodo, onTodoAdded }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title cannot be empty!");
      return;
    }
    setIsAdding(true);
    try {
      await onAddTodo(title, description);
      setTitle("");
      setDescription("");
      if (onTodoAdded) {
        onTodoAdded();
      }
    } catch (err) {
      console.error("Failed to add todo from form:", err);
      setError(err.message || "Failed to add todo. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const inputClasses =
    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 transition duration-150 ease-in-out";
  const buttonClasses =
    "w-full sm:w-auto flex justify-center py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-60 transition duration-150 ease-in-out cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="new-todo-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title
        </label>
        <input
          id="new-todo-title"
          type="text"
          placeholder="Todo title (required)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClasses}
          aria-label="New todo title"
        />
      </div>
      <div>
        <label
          htmlFor="new-todo-desc"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="new-todo-desc"
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`${inputClasses} resize-y min-h-[96px] max-h-40`}
          aria-label="New todo description"
        />
      </div>
      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={isAdding} className={buttonClasses}>
          {isAdding ? "Adding..." : "Add Todo"}
        </button>
      </div>
    </form>
  );
};

export default AddTodoForm;
