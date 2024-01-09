const app = require("./app");
const http = require("http");

const server = http.createServer(app);
const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log("App running on port", port);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
