// Example external node at https://example.com/customNode.js
export function register(nodeRegistry) {
  function createCustomNode(id, position, value = "") {
    return {
      id,
      title: "Custom",
      value: "This is a test custom node",
      nodeType: "Custom",
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
      process: async ({ node, getInputValue }) => {
        const input = await getInputValue(node.id * 100 + 1);
        return `Processed by custom node: ${input || ""}`;
      },
    };
  }

  // Register the node type
  nodeRegistry.registerNodeType("Custom", createCustomNode);
}
