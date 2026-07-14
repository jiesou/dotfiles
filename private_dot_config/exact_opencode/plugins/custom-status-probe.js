import { createServer } from "http";

const BUSY = new Set();

export const StatusProbe = async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      busy: BUSY.size > 0,
      count: BUSY.size,
      updatedAt: Date.now(),
    }));
  });

  server.on("error", () => {});
  server.listen(4098, "127.0.0.1");
  server.unref();

  return {
    event: async ({ event }) => {
      if (event.type === "session.status") {
        const { sessionID, status } = event.properties;
        if (status.type === "busy" || status.type === "retry") {
          BUSY.add(sessionID);
        } else {
          BUSY.delete(sessionID);
        }
      } else if (event.type === "session.idle") {
        BUSY.delete(event.properties.sessionID);
      }
    },
  };
};
