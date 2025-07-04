function ast() {
  const fs = require("fs");

  const parser = require("@babel/parser");

  let js = fs.readFileSync("script.js", "utf-8");

  const ast = parser.parse(js);

  console.log(ast);
}