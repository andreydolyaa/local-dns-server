import dns from "dns";
import dgram from "dgram";
import dnsPacket from "dns-packet";


// Test - nslookup site2.com 127.0.0.1

const addressMappings = {
  "site1.com": { host: "127.0.0.1", port: 5001 },
  "site2.com": { host: "127.0.0.1", port: 6001 },
};

const server = dgram.createSocket("udp4");

function dnsLookupPromise(host) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        reject(err);
      } else {
        resolve(address);
      }
    });
  });
}

function parseDNSPacket(hexQuery) {
  const buffer = Buffer.from(hexQuery, "hex");
  return dnsPacket.decode(buffer);
}

async function handleDNSQuery(msg, rinfo) {
  const query = msg.toString("hex");
  const parsed = parseDNSPacket(query);
  const domainName = parsed.questions[0]?.name;
  const response = addressMappings[domainName];

  if (response) {
    await sendDNSResponse(parsed, domainName, response, rinfo);
  } else {
    sendNotFoundResponse(rinfo);
  }
}

async function sendDNSResponse(parsed, domainName, response, rinfo) {
  const { host, port } = response;
  const address = await dnsLookupPromise(host);
  const resolvedAddress = `${address}:${port}`;

  console.log(`Received DNS query for domain: ${domainName}`);
  console.log(`Responding with IP address: ${resolvedAddress}`);

  const responsePacket = {
    ...parsed,
    id: parsed.id,
    questions: [],
    answers: [
      {
        type: "A",
        name: domainName,
        data: resolvedAddress,
      },
    ],
  };

  const responseBuffer = dnsPacket.encode(responsePacket);
  responseBuffer.writeUInt16BE(parsed.id, 0);

  server.send(
    responseBuffer,
    0,
    responseBuffer.length,
    rinfo.port,
    rinfo.address,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
}

function sendNotFoundResponse(rinfo) {
  const notFoundMessage = Buffer.from("Not Found");

  server.send(
    notFoundMessage,
    0,
    notFoundMessage.length,
    rinfo.port,
    rinfo.address,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
}
server.on("message", (msg, rinfo) => {
  try {
    handleDNSQuery(msg, rinfo);
  } catch (err) {
    console.error("Error processing DNS message:", err);
  }
});

server.on("listening", () => {
  const address = server.address();
  console.log(`DNS Server running [${address.address}:${address.port}]`);
});

server.bind(53);
