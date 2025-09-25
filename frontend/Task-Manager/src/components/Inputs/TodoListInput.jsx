import React, { useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";

const TodoListInput = ({ todoList, setTodoList,isDisabled  }) => {
  const [newTodoText, setNewTodoText] = useState("");

  // Add a new todo item to the list
  const handleAddTodo = () => {
    if (newTodoText.trim() !== "") {
      // Change 1: Add a unique ID to new items for reliable updates
      const newTodo = {
        _id: Date.now().toString(), // Simple unique ID
        text: newTodoText,
        completed: false
      };
      setTodoList([...todoList, newTodo]);
      setNewTodoText("");
    }
  };

  // Change 2: Modify to use 'id' instead of 'index'
  const handleRemoveTodo = (id) => {
    const updatedList = todoList.filter((item) => item._id !== id);
    setTodoList(updatedList);
  };

  // Change 3: Modify to use 'id' instead of 'index'
  const handleToggleCompleted = (id) => {
    const updatedList = todoList.map((item) =>
      item._id === id ? { ...item, completed: !item.completed } : item
    );
    setTodoList(updatedList);
  };

  return (
    <div>
      {/* List of existing todo items */}
      {todoList?.map((item, index) => (
        <div
          key={item._id || `new-todo-${index}`}
          className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-md mb-2"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.completed || false}
              // Change 4: Pass the item's unique ID
              onChange={() => handleToggleCompleted(item._id)}
              disabled={isDisabled}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer"
            />
            <p className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-gray-800'}`}>
                {item.text}
            </p>
          </div>
          <button
            // Change 5: Pass the item's unique ID
            onClick={() => handleRemoveTodo(item._id)}
            // Change 6: Add disabled logic and styling
            disabled={item.isDefault}
            className="text-slate-400 hover:text-rose-500 disabled:text-slate-200 disabled:cursor-not-allowed"
          >
            <LuTrash2 />
          </button>
        </div>
      ))}

      {/* Input to add a new todo item */}
      <div className="flex items-center gap-2 mt-3">
        <input
          placeholder="Add a new checklist item..."
          className="form-input flex-1"
          value={newTodoText}
          onChange={({ target }) => setNewTodoText(target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
        />
        <button
          className="p-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={handleAddTodo}
        >
          <LuPlus />
        </button>
      </div>
    </div>
  );
};

export default TodoListInput;