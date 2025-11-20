/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
    If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import {
  createNode,
  getConfigParameters,
  getConfigParameter,
  setConfigParameter,
  BaseNode,
  Socket,
  ConfigParameterType,
} from '@/modules/flow/types/NodeTypes';

// Test data factories
const createMockSocket = (
  id: number,
  type: 'input' | 'output',
  nodeId: number,
  title = 'Test Socket'
): Socket => ({
  id,
  title,
  type,
  nodeId,
  dataType: 'string',
});

const createMockConfigParameter = (
  parameterName: string,
  parameterType: 'string' | 'text' | 'number' | 'boolean' = 'string',
  defaultValue: string | number | boolean = 'default',
  valueSource: 'UserInput' | 'Env' | 'Default' | 'RuntimeVault' = 'Default',
  description = 'Test parameter',
  paramValue?: string | number | boolean
): ConfigParameterType => ({
  parameterName,
  parameterType,
  defaultValue,
  valueSource,
  description,
  paramValue: paramValue ?? defaultValue, // Set paramValue to defaultValue if not provided
});

const createMockBaseNode = (
  id: number,
  title = 'Test Node',
  nodeType = 'Generic',
  x = 100,
  y = 100,
  configParameters: ConfigParameterType[] = []
): BaseNode => ({
  id,
  category: 'Test',
  title,
  nodeType,
  nodeValue: 'test value',
  x,
  y,
  width: 200,
  height: 100,
  sockets: [
    createMockSocket(id * 100 + 1, 'input', id),
    createMockSocket(id * 100 + 2, 'output', id)
  ],
  selected: false,
  processing: false,
  configParameters,
  getConfigParameters: function () { return this.configParameters ?? []; },
  getConfigParameter: function (parameterName: string) {
    return (this.configParameters ?? []).find(param => param.parameterName === parameterName);
  },
  setConfigParameter: function (parameterName: string, value: string | number | boolean) {
    const parameter = (this.configParameters ?? []).find(param => param.parameterName === parameterName);
    if (parameter) {
      parameter.paramValue = value;
    }
  },
});

describe('createNode', () => {
  it('should create a node with correct properties when duplicate is false', () => {
    const templateNode = createMockBaseNode(0, 'Template', 'Generic', 0, 0, [
      createMockConfigParameter('param1', 'string', 'default1'),
      createMockConfigParameter('param2', 'number', 42),
    ]);
    const position = { x: 50, y: 75 };
    const newId = 5;

    const result = createNode(newId, position, templateNode, false);

    expect(result.id).toBe(newId);
    expect(result.title).toBe('Template');
    expect(result.nodeType).toBe('Generic');
    expect(result.x).toBe(50);
    expect(result.y).toBe(75);
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
    expect(result.selected).toBe(false);
    expect(result.processing).toBe(false);
    expect(result.sockets).toHaveLength(2);
    expect(result.sockets[0].id).toBe(501); // newId * 100 + 1
    expect(result.sockets[0].nodeId).toBe(newId);
    expect(result.sockets[1].id).toBe(502); // newId * 100 + 2
    expect(result.sockets[1].nodeId).toBe(newId);
    expect(result.configParameters).toHaveLength(2);
    expect(result.configParameters![0].parameterName).toBe('param1');
    expect(result.configParameters![0].paramValue).toBe('default1'); // defaultValue used
    expect(result.configParameters![1].parameterName).toBe('param2');
    expect(result.configParameters![1].paramValue).toBe(42); // defaultValue used
  });

  it('should create a node with correct properties when duplicate is true', () => {
    const templateNode = createMockBaseNode(0, 'Template', 'Generic', 0, 0, [
      createMockConfigParameter('param1', 'string', 'default1'),
      createMockConfigParameter('param2', 'number', 42),
    ]);
    // Simulate existing paramValue from previous node
    templateNode.configParameters![0].paramValue = 'existing1';
    templateNode.configParameters![1].paramValue = 100;

    const position = { x: 50, y: 75 };
    const newId = 5;

    const result = createNode(newId, position, templateNode, true);

    expect(result.configParameters).toHaveLength(2);
    expect(result.configParameters![0].parameterName).toBe('param1');
    expect(result.configParameters![0].paramValue).toBe('existing1'); // existing value preserved
    expect(result.configParameters![1].parameterName).toBe('param2');
    expect(result.configParameters![1].paramValue).toBe(100); // existing value preserved
  });

  it('should handle node without configParameters', () => {
    const templateNode = createMockBaseNode(0, 'Template', 'Generic', 0, 0);
    templateNode.configParameters = undefined;
    const position = { x: 50, y: 75 };
    const newId = 5;

    const result = createNode(newId, position, templateNode, false);

    expect(result.configParameters).toBeUndefined();
  });

  it('should handle empty configParameters array', () => {
    const templateNode = createMockBaseNode(0, 'Template', 'Generic', 0, 0, []);
    const position = { x: 50, y: 75 };
    const newId = 5;

    const result = createNode(newId, position, templateNode, false);

    expect(result.configParameters).toEqual([]);
  });

  it('should assign correct socket IDs based on node ID', () => {
    const templateNode = createMockBaseNode(0, 'Template', 'Generic', 0, 0);
    const position = { x: 0, y: 0 };
    const newId = 10;

    const result = createNode(newId, position, templateNode, false);

    expect(result.sockets[0].id).toBe(1001); // 10 * 100 + 1
    expect(result.sockets[1].id).toBe(1002); // 10 * 100 + 2
  });
});

describe('getConfigParameters', () => {
  it('should return configParameters array when it exists', () => {
    const configParams = [
      createMockConfigParameter('param1'),
      createMockConfigParameter('param2'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    const result = getConfigParameters(node);

    expect(result).toEqual(configParams);
  });

  it('should return empty array when configParameters is undefined', () => {
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0);
    node.configParameters = undefined;

    const result = getConfigParameters(node);

    expect(result).toEqual([]);
  });

  it('should return empty array when configParameters is null', () => {
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0);
    node.configParameters = null as any;

    const result = getConfigParameters(node);

    expect(result).toEqual([]);
  });
});

describe('getConfigParameter', () => {
  it('should return the parameter when it exists', () => {
    const configParams = [
      createMockConfigParameter('param1', 'string', 'value1'),
      createMockConfigParameter('param2', 'number', 42),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    const result = getConfigParameter(node, 'param2');

    expect(result).toEqual(configParams[1]);
  });

  it('should return undefined when parameter does not exist', () => {
    const configParams = [
      createMockConfigParameter('param1', 'string', 'value1'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    const result = getConfigParameter(node, 'nonexistent');

    expect(result).toBeUndefined();
  });

  it('should return undefined when configParameters is undefined', () => {
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0);
    node.configParameters = undefined;

    const result = getConfigParameter(node, 'param1');

    expect(result).toBeUndefined();
  });

  it('should handle case-sensitive parameter names', () => {
    const configParams = [
      createMockConfigParameter('Param1', 'string', 'value1'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    const result1 = getConfigParameter(node, 'Param1');
    const result2 = getConfigParameter(node, 'param1');

    expect(result1).toEqual(configParams[0]);
    expect(result2).toBeUndefined();
  });
});

describe('setConfigParameter', () => {
  it('should set string parameter value correctly', () => {
    const configParams = [
      createMockConfigParameter('param1', 'string', 'default'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    setConfigParameter(node, 'param1', 'new value');

    expect(node.configParameters![0].paramValue).toBe('new value');
  });

  it('should set number parameter value correctly', () => {
    const configParams = [
      createMockConfigParameter('param1', 'number', 0),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    setConfigParameter(node, 'param1', 123);

    expect(node.configParameters![0].paramValue).toBe(123);
  });

  it('should set boolean parameter value correctly', () => {
    const configParams = [
      createMockConfigParameter('param1', 'boolean', false),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    setConfigParameter(node, 'param1', true);

    expect(node.configParameters![0].paramValue).toBe(true);
  });

  it('should set undefined parameter value correctly', () => {
    const configParams = [
      createMockConfigParameter('param1', 'string', 'default'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    setConfigParameter(node, 'param1', undefined);

    expect(node.configParameters![0].paramValue).toBeUndefined();
  });

  it('should throw error for invalid parameter value type', () => {
    const configParams = [
      createMockConfigParameter('param1', 'string', 'default'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    expect(() => setConfigParameter(node, 'param1', { invalid: 'object' })).toThrow(
      'Invalid type for paramValue: object. Must be string, number, boolean, or undefined.'
    );
  });

  it('should throw error for array parameter value', () => {
    const configParams = [
      createMockConfigParameter('param1', 'string', 'default'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    expect(() => setConfigParameter(node, 'param1', ['array'])).toThrow(
      'Invalid type for paramValue: object. Must be string, number, boolean, or undefined.'
    );
  });

  it('should do nothing when parameter does not exist', () => {
    const configParams = [
      createMockConfigParameter('param1', 'string', 'default'),
    ];
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0, configParams);

    setConfigParameter(node, 'nonexistent', 'value');

    expect(node.configParameters![0].paramValue).toBe('default');
  });

  it('should do nothing when configParameters is undefined', () => {
    const node = createMockBaseNode(1, 'Test', 'Generic', 0, 0);
    node.configParameters = undefined;

    expect(() => setConfigParameter(node, 'param1', 'value')).not.toThrow();
  });
});