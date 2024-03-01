import router from "./router.js";
import Server from "./server.js";




const server = new Server({
  host: "127.0.0.1",
  port: 6001,
  router,
});

server.run();
