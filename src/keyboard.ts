export function setup_keyboard(on_key: (key: string) => void): void {
  const stdin = process.stdin;

  if (typeof stdin.setRawMode === "function") {
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();

    stdin.on("data", (key: string) => {
      if (key === "\u0003") process.exit();
      on_key(key);
    });
  } else {
    console.log("Terminal non interactif : clavier désactivé.");
  }
}
