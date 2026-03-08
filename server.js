const http = require("http");
const fs = require("fs");
const https = require("https");

const server = http.createServer((req, res) => {

    if (req.method === "GET" && req.url === "/") {

        fs.readFile("index.html", (err, data) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });

    }

    else if (req.method === "POST" && req.url === "/analyze") {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            const code = body;

            const lines = code.split("\n").length;
            const loops = (code.match(/for|while/g) || []).length;
            const conditions = (code.match(/if/g) || []).length;

            const complexity = loops + conditions;

            const risks = (code.match(/eval|exec|system|subprocess/g) || []).length;

            const health = Math.max(100 - complexity * 5 - risks * 10, 0);

            let status = "Good";
            let color = "green";

            if (health < 70) {
                status = "Medium";
                color = "orange";
            }

            if (health < 40) {
                status = "Danger";
                color = "red";
            }

            const result = JSON.stringify({
                lines,
                loops,
                conditions,
                complexity,
                risks,
                health,
                status,
                color
            });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(result);

        });

    }

    else if (req.method === "POST" && req.url === "/github") {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            const repoUrl = body.trim();

            const parts = repoUrl.replace("https://github.com/","").split("/");
            const user = parts[0];
            const repo = parts[1];

            const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents`;

            const options = {
                headers: { "User-Agent": "codedna" }
            };

            https.get(apiUrl, options, (apiRes) => {

                let data = "";

                apiRes.on("data", chunk => {
                    data += chunk;
                });

                apiRes.on("end", () => {

                    const files = JSON.parse(data);

                    let fileCount = 0;

                    files.forEach(file => {
                        if(file.type === "file"){
                            fileCount++;
                        }
                    });

                    const result = JSON.stringify({
                        repository: repo,
                        files_scanned: fileCount
                    });

                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(result);

                });

            });

        });

    }

});

server.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
});