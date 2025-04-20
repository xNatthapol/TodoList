import React, { useState, useEffect, useCallback, useRef } from "react";
import * as todoService from "../services/todoService";
import * as uploadService from "../services/uploadService";
import TodoList from "../components/todo/TodoList";
import Modal from "../components/common/Modal";
import AddTodoForm from "../components/todo/AddTodoForm";

function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [editError, setEditError] = useState("");
  const editFileInputRef = useRef(null);

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

  const filteredTodos =
    filterStatus === "All"
      ? todos
      : filterStatus === "Hide Done"
        ? todos.filter((todo) => todo.status !== "Done")
        : todos.filter((todo) => todo.status === filterStatus);

  const handleAddTodo = async (title, description, imageUrl) => {
    setError("");
    try {
      const newTodo = await todoService.addTodo(title, description, imageUrl);
      setTodos((prevTodos) => [newTodo, ...prevTodos]);
    } catch (err) {
      console.error("Failed to add todo (from page):", err);
      setError(err.error || "Failed to add todo.");
      throw err;
    }
  };

  const handleViewEditClick = (todo) => {
    setSelectedTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditStatus(todo.status);
    setEditImageUrl(todo.image_url || "");
    setEditPreviewUrl(todo.image_url || null);
    setEditSelectedFile(null);
    setEditError("");
    setIsEditUploading(false);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setIsViewEditModalOpen(true);
  };

  const handleCloseViewEditModal = () => {
    setIsViewEditModalOpen(false);
    setSelectedTodo(null);
    if (editPreviewUrl && editPreviewUrl !== selectedTodo?.image_url) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditPreviewUrl(null);
  };

  const handleEditFileChange = async (event) => {
    setEditError("");
    const file = event.target.files?.[0];
    if (!file) {
      setEditSelectedFile(null);
      return;
    }

    // Validation
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setEditError("Invalid file type (JPG, PNG only).");
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      setEditSelectedFile(null);
      return;
    }
    // Max file size 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setEditError("File too large (Max 5MB).");
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      setEditSelectedFile(null);
      return;
    }

    setEditSelectedFile(file);

    // Clean up old preview URL before creating new one
    if (editPreviewUrl && editPreviewUrl !== selectedTodo?.image_url) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setEditPreviewUrl(objectUrl);

    setIsEditUploading(true);
    setEditImageUrl("");
    try {
      const result = await uploadService.uploadImage(file);
      setEditImageUrl(result.image_url);
      setEditError("");
    } catch (uploadError) {
      console.error("Upload failed in edit modal:", uploadError);
      setEditError(uploadError.message || "Image upload failed.");
      setEditPreviewUrl(selectedTodo?.image_url || null);
      setEditSelectedFile(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    } finally {
      setIsEditUploading(false);
    }
  };

  const handleRemoveEditImage = () => {
    if (editPreviewUrl && editPreviewUrl !== selectedTodo?.image_url) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditSelectedFile(null);
    setEditPreviewUrl(null);
    setEditImageUrl("");
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!selectedTodo || !editTitle.trim()) {
      setEditError("Title cannot be empty!");
      return;
    }
    if (isEditUploading) {
      setEditError("Please wait for image upload to complete.");
      return;
    }
    setEditError("");

    const originalTodos = todos.map((t) => ({ ...t }));

    const descriptionChanged =
      editDescription !== (selectedTodo.description || "");
    const titleChanged = editTitle !== selectedTodo.title;
    const statusChanged = editStatus !== selectedTodo.status;
    const imageChanged = editImageUrl !== (selectedTodo.image_url || "");

    let contentUpdateData = {};
    if (titleChanged) contentUpdateData.title = editTitle;
    if (descriptionChanged) contentUpdateData.description = editDescription;
    if (imageChanged) contentUpdateData.imageUrl = editImageUrl;

    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === selectedTodo.id
          ? {
              ...todo,
              title: editTitle,
              description: editDescription,
              status: editStatus,
              image_url: editImageUrl,
            }
          : todo,
      ),
    );

    try {
      let promises = [];
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
      setEditError(err.error || "Failed to save changes.");
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
    setEditError("");

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
      handleCloseViewEditModal();
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
  const fileInputButtonClasses =
    "text-sm text-violet-600 hover:text-violet-800 cursor-pointer font-medium underline";

  const filterButtonClasses =
    "py-1 px-3 border rounded-full shadow-sm text-sm font-medium transition duration-150 ease-in-out cursor-pointer";

  const filterStatusButtonClasses = {
    All: "border-gray-300 hover:bg-blue-100",
    Pending: "border-gray-300 hover:bg-gray-100",
    "In Progress": "border-gray-300 hover:bg-yellow-100",
    Done: "border-gray-300 hover:bg-green-100",
    "Hide Done": "border-gray-300 hover:bg-violet-100",
  };

  const activeButtonClass = "text-black bg-white";

  return (
    <div className="mt-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">My Todo List</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={primaryButtonClasses}
        >
          Add New Todo
        </button>
      </div>

      <div className="mb-4">
        <label className="mr-2 font-medium text-gray-700">
          Filter by Status:
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus("All")}
            className={`${filterButtonClasses} ${filterStatus === "All" ? activeButtonClass : "bg-white"} ${filterStatusButtonClasses["All"]}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus("Hide Done")}
            className={`${filterButtonClasses} ${filterStatus === "Hide Done" ? activeButtonClass : "bg-white"} ${filterStatusButtonClasses["Hide Done"]}`}
          >
            Hide Done
          </button>
          <button
            onClick={() => setFilterStatus("Pending")}
            className={`${filterButtonClasses} ${filterStatus === "Pending" ? activeButtonClass : "bg-white"} ${filterStatusButtonClasses["Pending"]}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus("In Progress")}
            className={`${filterButtonClasses} ${filterStatus === "In Progress" ? activeButtonClass : "bg-white"} ${filterStatusButtonClasses["In Progress"]}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterStatus("Done")}
            className={`${filterButtonClasses} ${filterStatus === "Done" ? activeButtonClass : "bg-white"} ${filterStatusButtonClasses["Done"]}`}
          >
            Done
          </button>
        </div>
      </div>

      {error && !isLoading && (
        <p className="text-center text-red-600 my-3 p-2 bg-red-100 border border-red-400 rounded">
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="text-center text-gray-500 mt-10">Loading todos...</p>
      ) : (
        <TodoList todos={filteredTodos} onViewEditClick={handleViewEditClick} />
      )}
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
      {selectedTodo && (
        <Modal
          isOpen={isViewEditModalOpen}
          onClose={handleCloseViewEditModal}
          title="Edit Todo Details"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2 flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image
              </label>
              <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 overflow-hidden bg-gray-50">
                {editPreviewUrl ? (
                  <img
                    src={editPreviewUrl}
                    alt="Todo Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>No Image</span>
                )}
              </div>
              <input
                type="file"
                id="edit-todo-image"
                ref={editFileInputRef}
                onChange={handleEditFileChange}
                accept="image/png, image/jpeg, image/gif, image/webp"
                className="sr-only"
              />
              <div className="flex items-center justify-center space-x-3 w-full mt-1">
                <label
                  htmlFor="edit-todo-image"
                  className={fileInputButtonClasses}
                >
                  {editSelectedFile
                    ? `Uploading...`
                    : editImageUrl
                      ? "Change"
                      : "Upload"}{" "}
                  Image
                </label>
                {editPreviewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveEditImage}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              {isEditUploading && (
                <p className="text-sm text-violet-600">Uploading image...</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
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
            </div>

            <div className="md:col-span-3 pt-4 border-t mt-2">
              {editError && (
                <p className="text-red-600 text-sm font-medium mb-3">
                  {editError}
                </p>
              )}
              <div className="flex justify-between items-center">
                <button
                  onClick={handleDeleteFromModal}
                  className={dangerButtonClasses}
                >
                  Delete Todo
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
                    disabled={isEditUploading}
                  >
                    {isEditUploading ? "Uploading..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>{" "}
        </Modal>
      )}
    </div>
  );
}

export default TodoPage;
