import { BaseNode, Position, ConfigParameterType } from "../NodeTypes";
import { NodeRegistry } from "../NodeRegistry";
export interface MathExpressionNode extends BaseNode {
  nodeType: "MathExpression";
}

export function register(nodeRegistry: NodeRegistry): void {
  function createMathExpressionNode(
    id: number,
    position: Position,
    nodeValue: number = 0
  ): BaseNode {
    return {
      id,
      title: "Math Expression",
      nodeValue: 0,
      nodeType: "MathExpression",
      sockets: [
        {
          id: id * 100 + 1,
          title: "Input",
          type: "input",
          nodeId: id,
          dataType: "string",
        },
        {
          id: id * 100 + 2,
          title: "Output",
          type: "output",
          nodeId: id,
          dataType: "string",
        },
      ],
      x: position.x,
      y: position.y,
      width: 300,
      height: 220,
      selected: false,
      processing: false,
      process: async ({ node, getInputValue }: any): Promise<number> => {
        const a = Number((await getInputValue(node.id * 100 + 1)) || 0);
        const b = Number((await getInputValue(node.id * 100 + 2)) || 0);
        nodeValue = a + b;
        return nodeValue;
      },
      configParameters: [
        {
          parameterName: "Expression",
          parameterType: "number",
          defaultValue: false,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Default Number output",
          isNodeBodyContent: true,
        },
      ],
      getConfigParameters: function (): ConfigParameterType[] {
        return this.configParameters || [];
      },
      getConfigParameter(
        parameterName: string
      ): ConfigParameterType | undefined {
        const parameter = (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
        return parameter;
      },
      setConfigParameter(parameterName: string, value: any): void {
        const parameter = (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
        if (parameter) {
          parameter.paramValue = value;
        }
      },
    };
  }
  nodeRegistry.registerNodeType("MathExpression", createMathExpressionNode);
}
