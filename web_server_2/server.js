import http from "http";
import express from "express";

class Server {
  constructor(options = {}) {
    this.host = options.host;
    this.port = options.port;
    this.router = options.router;
    this.app = express();
    this.app.use(this.router);
    this.app.use(express.json());
    this.server = http.createServer(this.app);
  }
  run() {
    const info = () => console.log(`web server 2 started [${this.port}]`);
    this.server.listen(this.port, this.host, () => info());
  }
}

export default Server;
