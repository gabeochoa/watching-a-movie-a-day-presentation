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

export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

