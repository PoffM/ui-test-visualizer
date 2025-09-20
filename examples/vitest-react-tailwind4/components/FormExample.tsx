import React, { useState } from 'react'

const FormExample: React.FC = () => {
  const [submitCount, setSubmitCount] = useState(0)
  return (
    <div className="">
      <div>
        Submit Count: {submitCount}
      </div>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-2">Form Section</h2>
        <div className="border border-gray-300 p-4 mb-4">
          <form
            className="mb-4"
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitCount(c => c + 1)
            }}
          >
            <label>
              First input
              <input
                type="text"
                className="border p-2 mr-2"
                placeholder="First input"
                aria-label="First input"
              />
            </label>
            <label>
              Second input
              <input
                type="text"
                className="border p-2 mr-2"
                placeholder="Second input"
              />
            </label>
            <label>
              Select menu
              <select className="border p-2 mr-2" aria-label="Select menu">
                <option value="">Choose an option</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                <option value="option3">Option 3</option>
              </select>
            </label>
            <button type="submit" className="bg-blue-500 text-white p-2">
              Submit
            </button>
          </form>
        </div>
        <h2 className="text-lg font-bold mb-2">Non-Form Section</h2>
        <div className="border border-gray-300 p-4">
          <label>
            Outside input 1
            <input
              type="text"
              className="border p-2 mr-2"
              placeholder="Outside input 1"
            />
          </label>
          <label>
            Outside input 2
            <input
              type="text"
              className="border p-2 mr-2"
              placeholder="Outside input 2"
            />
          </label>
          <button className="bg-green-500 text-white p-2">
            Outside Button
          </button>
          <p className="mt-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FormExample
