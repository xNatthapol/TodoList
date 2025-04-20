import React, { useState, useEffect, useCallback } from "react";
import * as todoService from "../services/todoService";
import TodoList from "../components/todo/TodoList";
import AddTodoForm from "../components/todo/AddTodoForm";
import Modal from "../components/common/Modal";

function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const fetchedTodos = await todoService.getTodos();
      setTodos(fetchedTodos || []);
    } catch (err) {
      setError("Failed to fetch todos. Please try again later.");
      console.error(err);
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async (title, description) => {
    setError("");
    if (!title) return;
    try {
      const newTodo = await todoService.addTodo(title, description);
      setTodos((prevTodos) => [newTodo, ...prevTodos]);
    } catch (err) {
      console.error("Failed to add todo:", err);
      setError(err.error || "Failed to add todo.");
      throw err;
    }
  };

  const handleViewEditClick = (todo) => {
    setSelectedTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditStatus(todo.status);
    setIsViewEditModalOpen(true);
  };

  const handleCloseViewEditModal = () => {
    setIsViewEditModalOpen(false);
    setSelectedTodo(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedTodo || !editTitle.trim()) {
      alert("Title cannot be empty!");
      return;
    }
    setError("");

    const descriptionChanged =
      editDescription !== (selectedTodo.description || "");
    const titleChanged = editTitle !== selectedTodo.title;
    const statusChanged = editStatus !== selectedTodo.status;

    const originalTodos = todos.map((t) => ({ ...t }));
    let promises = [];

    let contentUpdateData = {};
    if (titleChanged) contentUpdateData.title = editTitle;
    if (descriptionChanged) contentUpdateData.description = editDescription;

    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === selectedTodo.id
          ? { ...todo, ...contentUpdateData, status: editStatus }
          : todo,
      ),
    );

    try {
      if (Object.keys(contentUpdateData).length > 0) {
        promises.push(
          todoService.updateTodo(selectedTodo.id, contentUpdateData),
        );
      }
      if (statusChanged) {
        promises.push(
          todoService.updateTodoStatus(selectedTodo.id, editStatus),
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      } else {
        console.log("No changes detected to save.");
      }
      handleCloseViewEditModal();
    } catch (err) {
      console.error("Failed to save updates:", err);
      setError(err.error || "Failed to save changes.");
      setTodos(originalTodos);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!selectedTodo) return;
    if (
      !window.confirm(
        `Delete "${selectedTodo.title}"? This action cannot be undone.`,
      )
    )
      return;
    setError("");

    const originalTodos = [...todos];
    setTodos((prevTodos) =>
      prevTodos.filter((todo) => todo.id !== selectedTodo.id),
    );

    try {
      await todoService.deleteTodo(selectedTodo.id);
      handleCloseViewEditModal();
    } catch (err) {
      setError(err.error || "Failed to delete todo.");
      setTodos(originalTodos);
      console.error(err);
    }
  };

  const inputClasses =
    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 transition duration-150 ease-in-out";
  const buttonClasses =
    "py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out cursor-pointer";
  const primaryButtonClasses = `${buttonClasses} bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 disabled:opacity-60`;
  const secondaryButtonClasses = `${buttonClasses} bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300 focus:ring-indigo-500`;
  const dangerButtonClasses = `${buttonClasses} bg-red-600 hover:bg-red-700 focus:ring-red-500`;
  const saveEditButtonClasses = `${buttonClasses} bg-green-600 hover:bg-green-700 focus:ring-green-500`;

  return (
    <div className="mt-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">My Todo List</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={primaryButtonClasses}
        >
          Add New Todo
        </button>
      </div>

      {error && !isLoading && (
        <p className="text-center text-red-600 my-3 p-2 bg-red-100 border border-red-400 rounded">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-center text-gray-500 mt-10">Loading todos...</p>
      ) : (
        <TodoList todos={todos} onViewEditClick={handleViewEditClick} />
      )}

      {/* Add Todo Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Todo"
      >
        <AddTodoForm
          onAddTodo={handleAddTodo}
          onTodoAdded={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* View/Edit Todo Modal */}
      {selectedTodo && (
        <Modal
          isOpen={isViewEditModalOpen}
          onClose={handleCloseViewEditModal}
          title="Edit Todo Details"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={`${inputClasses} text-lg font-semibold`}
                required
              />
            </div>
            <div>
              <label
                htmlFor="edit-desc"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description..."
                rows={4}
                className={`${inputClasses} resize-y min-h-[96px] max-h-60`}
              />
            </div>
            <div>
              <label
                htmlFor="edit-status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className={inputClasses}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <button
                onClick={handleDeleteFromModal}
                className={dangerButtonClasses}
              >
                Delete
              </button>
              <div className="space-x-3">
                <button
                  onClick={handleCloseViewEditModal}
                  className={secondaryButtonClasses}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className={saveEditButtonClasses}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TodoPage;
