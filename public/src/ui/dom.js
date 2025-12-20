export function el(selector, root = document) {
  const node = root.querySelector(selector);
  if (!node) throw new Error(`Missing element: ${selector}`);
  return node;
}

export function on(node, event, handler, options) {
  node.addEventListener(event, handler, options);
}

export function setText(node, text) {
  // eslint-disable-next-line no-param-reassign
  node.textContent = text;
}

