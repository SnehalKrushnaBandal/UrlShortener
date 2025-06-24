import { createServer } from "http";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const Data_File = path.join("data", "links.json");

// Functions to add files
const serveFiles = async (res, filePath, contentType) => {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 page not found");
  }
};

// to store all links
const loadLinks = async () => {
  try {
    const Final_File_Data = await readFile(Data_File, "utf-8");
    return JSON.parse(Final_File_Data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(Data_File, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};
    
// save data in JSON file
const saveLinks = async (links) => {
await writeFile(Data_File, JSON.stringify(links));
};

const server = createServer(async (req, res) => {
  console.log(req.url);

  if (req.method === "GET") {
    if (req.url === "/") {
      return serveFiles(res, path.join(__dirname, "index.html"), "text/html");
    } else if (req.url === "/style.css") {
      return serveFiles(res, path.join(__dirname, "style.css"), "text/css");
    } else if(req.url === "/links"){
    const links = await loadLinks();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(links));

    } else {
    const links = await loadLinks();
    const shortCode = req.url.slice(1);
    if (links[shortCode]){
      res.writeHead(302, { location : links[shortCode]});
      return res.end();
    }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Page not found");
    }
  }

  if (req.method === "POST" && req.url === "/shorten") {
    // to store all links
    const links = await loadLinks();

    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", async() => {
      console.log(data);
      const { url, shortCode } = JSON.parse(data);

      if (!url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("URL is required..");
      }

      // final short codes
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      // to chaeck duplicate links
      if (links[finalShortCode]) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Short code already exists. Please choose another.");
      }

      links[finalShortCode] = url;

      await saveLinks(links);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({success:true, shortCode:finalShortCode}));

    });
  }
});

const port = process.env.PORT || 3003;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});
