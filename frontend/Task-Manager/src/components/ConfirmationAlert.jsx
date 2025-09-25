import React from 'react';
import { LuInfo, LuX } from 'react-icons/lu';

const ConfirmationAlert = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  // If the alert is not supposed to be open, render nothing.
  if (!isOpen) {
    return null;
  }

  return (
    // This is the full-screen backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      {/* This is the white modal panel */}
      <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
        {/* Close Button (top-right corner) */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <LuX size={20} />
        </button>

        {/* Icon and Text Content */}
        <div className="flex items-start gap-4">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0">
            <LuInfo className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-0 flex-grow">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              {title || 'Are you sure?'}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message || 'This action cannot be undone.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Cancel and Confirm) */}
        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:mt-5 sm:flex-row">
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationAlert;