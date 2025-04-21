import React, { useState, useRef, useEffect } from "react";
import * as uploadService from "../../services/uploadService";

const AddTodoForm = ({ onAddTodo, onTodoAdded }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    // Revoke the object URL to avoid memory leaks
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (event) => {
    setError("");
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadedImageUrl("");
      return;
    }

    // Validation
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type (JPG, PNG only).");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    // Max file size 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File too large (Max 5MB).");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);
    setUploadedImageUrl("");
    try {
      const result = await uploadService.uploadImage(file);
      setUploadedImageUrl(result.image_url);
      setError("");
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      setError(uploadError.message || "Image upload failed.");
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title cannot be empty!");
      return;
    }
    if (isUploading) {
      setError("Please wait for image upload to complete.");
      return;
    }
    setError("");
    setIsAdding(true);
    try {
      await onAddTodo(title, description, uploadedImageUrl);
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadedImageUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onTodoAdded) {
        onTodoAdded();
      }
    } catch (addError) {
      console.error("Failed to add todo:", addError);
      setError(addError.message || "Failed to add todo. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const inputClasses =
    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 transition duration-150 ease-in-out";
  const buttonClasses =
    "sm:w-auto flex justify-center py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-60 transition duration-150 ease-in-out cursor-pointer";
  const fileInputButtonClasses =
    "text-sm text-violet-600 hover:text-violet-800 cursor-pointer font-medium underline";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div className="md:col-span-1 space-y-2 flex flex-col items-center">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image (Optional)
        </label>
        <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>Image Preview</span>
          )}
        </div>
        <input
          type="file"
          id="new-todo-image"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif, image/webp"
          className="sr-only"
        />
        <label htmlFor="new-todo-image" className={fileInputButtonClasses}>
          {selectedFile
            ? `Change Image (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
            : "Choose Image"}
        </label>
        {isUploading && <p className="text-sm text-violet-600">Uploading...</p>}
      </div>

      <div className="md:col-span-2 space-y-4">
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
            Description (Optional)
          </label>
          <textarea
            id="new-todo-desc"
            placeholder="Description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClasses} resize-y min-h-[96px] max-h-40`}
            aria-label="New todo description"
          />
        </div>
      </div>

      <div className="md:col-span-3">
        {error && (
          <p className="text-red-600 text-sm font-medium mb-3">{error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isAdding || isUploading}
            className={buttonClasses}
          >
            {isAdding ? "Adding..." : "Add Todo"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddTodoForm;
