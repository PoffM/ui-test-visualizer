import { expect, test } from 'vitest'
import type { RecorderGeneratedCode } from '../../src/recorder/generate-code-from-input'
import { generateCodeFromInput } from '../../src/recorder/generate-code-from-input'

const userEventLibPath = '/fakepath/user-event-13.js'

test('change an empty text input: vitest', () => {
  const result = generateCodeFromInput(
    true,
    '@testing-library/react',
    'vitest',
    userEventLibPath,
    {
      event: 'change',
      eventData: { text: 'test-input' },
      findMethod: 'getByRole',
      queryArg0: 'textbox',
      queryOptions: { name: { type: 'regexp', value: '/^my-input$/i' } },
    },
  )

  const expected: RecorderGeneratedCode = {
    code: [
      `await userEvent.type(screen.getByRole('textbox', { name: /^my-input$/i }), 'test-input')`,
    ],
    debugExpression: `
(() => {
const { screen } = globalThis.require('@testing-library/react');
const userEvent = globalThis.require('/fakepath/user-event-13.js').default;
globalThis.require('react').act(() => { userEvent.type(screen.getByRole('textbox', { name: /^my-input$/i }), 'test-input') });
})()
`,
    requiredImports: {
      screen: '@testing-library/react',
      userEvent: '@testing-library/user-event',
    },
  }

  expect(result).toEqual(expected)
})

test('change a pre-filled text input', () => {
  const result = generateCodeFromInput(
    true,
    '@testing-library/react',
    'vitest',
    userEventLibPath,
    {
      event: 'change',
      eventData: { text: 'test-input', clearBeforeType: true },
      findMethod: 'getByRole',
      queryArg0: 'textbox',
      queryOptions: { name: { type: 'regexp', value: '/^my-input$/i' } },
    },
  )

  const expected: RecorderGeneratedCode = {
    code: [
      `await userEvent.clear(screen.getByRole('textbox', { name: /^my-input$/i }))`,
      `await userEvent.type(screen.getByRole('textbox', { name: /^my-input$/i }), 'test-input')`,
    ],
    debugExpression: `
(() => {
const { screen } = globalThis.require('@testing-library/react');
const userEvent = globalThis.require('/fakepath/user-event-13.js').default;
globalThis.require('react').act(() => { userEvent.clear(screen.getByRole('textbox', { name: /^my-input$/i }))
userEvent.type(screen.getByRole('textbox', { name: /^my-input$/i }), 'test-input') });
})()
`,
    requiredImports: {
      screen: '@testing-library/react',
      userEvent: '@testing-library/user-event',
    },
  }

  expect(result).toEqual(expected)
})

test('generate an expect statement: vitest', () => {
  const result = generateCodeFromInput(
    true,
    '@testing-library/react',
    'vitest',
    userEventLibPath,
    {
      event: 'click',
      eventData: {},
      findMethod: 'getByRole',
      queryArg0: 'button',
      queryOptions: { name: 'my-button' },
      useExpect: 'toBeEnabled',
    },
  )

  const expected: RecorderGeneratedCode = {
    code: [
      'expect(screen.getByRole(\'button\', { name: \'my-button\' })).toBeEnabled()',
    ],
    debugExpression: `
(() => {
const { screen } = globalThis.require('@testing-library/react');
expect(screen.getByRole('button', { name: 'my-button' })).toBeEnabled()
})()
`,
    requiredImports: {
      expect: 'vitest',
      screen: '@testing-library/react',
    },
  }

  expect(result).toEqual(expected)
})

test('generate an expect statement: jest', () => {
  const result = generateCodeFromInput(
    true,
    '@testing-library/react',
    'jest',
    userEventLibPath,
    {
      event: 'click',
      eventData: {},
      findMethod: 'getByRole',
      queryArg0: 'button',
      queryOptions: { name: 'my-button' },
      useExpect: 'toBeEnabled',
    },
  )

  const expected: RecorderGeneratedCode = {
    code: [
      'expect(screen.getByRole(\'button\', { name: \'my-button\' })).toBeEnabled()',
    ],
    debugExpression: `
(() => {
const { screen } = globalThis.require('@testing-library/react');
expect(screen.getByRole('button', { name: 'my-button' })).toBeEnabled()
})()
`,
    requiredImports: {
      screen: '@testing-library/react',
    },
  }

  expect(result).toEqual(expected)
})

test('generate an expect statement: bun test api', () => {
  const result = generateCodeFromInput(
    true,
    '@testing-library/react',
    'bun',
    userEventLibPath,
    {
      event: 'click',
      eventData: {},
      findMethod: 'getByRole',
      queryArg0: 'button',
      queryOptions: { name: 'my-button' },
      useExpect: 'toBeEnabled',
    },
  )

  const expected: RecorderGeneratedCode = {
    code: [
      'expect(screen.getByRole(\'button\', { name: \'my-button\' })).toBeEnabled()',
    ],
    debugExpression: `
(() => {
const { screen } = globalThis.require('@testing-library/react');
const { expect } = globalThis.require('bun:test');
expect(screen.getByRole('button', { name: 'my-button' })).toBeEnabled()
})()
`,
    requiredImports: {
      expect: 'bun:test',
      screen: '@testing-library/react',
    },
  }

  expect(result).toEqual(expected)
})

test('generate a mouseup event with fireEvent', () => {
  const result = generateCodeFromInput(
    true,
    '@testing-library/react',
    'vitest',
    userEventLibPath,
    {
      event: 'mouseUp',
      eventData: {},
      findMethod: 'getByRole',
      queryArg0: 'button',
      queryOptions: { name: 'my-button' },
      useFireEvent: true,
    },
  )

  const expected: RecorderGeneratedCode = {
    code: [
      'fireEvent.mouseUp(screen.getByRole(\'button\', { name: \'my-button\' }))',
    ],
    debugExpression: `
(() => {
const { screen } = globalThis.require('@testing-library/react');
const { fireEvent } = globalThis.require('@testing-library/react');
fireEvent.mouseUp(screen.getByRole('button', { name: 'my-button' }))
})()
`,
    requiredImports: {
      fireEvent: '@testing-library/react',
      screen: '@testing-library/react',
    },
  }

  expect(result).toEqual(expected)
})
