import { activate, deactivate } from "./vscode-extension.js";

const vscode = acode.require("vscode");
const id = "vscode-test";

if (window.acode) {
  acode.setPluginInit(id, async (rootUrl, $page) => {
    if (!rootUrl.endsWith("/")) rootUrl += "/";
    if (vscode && window.vsApi) {
      activate(new vscode.ExtensionContext(id));
    } else {
      window.addEventListener("vscode-api", async () => {
        activate(new vscode.ExtensionContext(id));
      });
    }
  });

  acode.setPluginUnmount(id, () => {
    deactivate();
  });
}
