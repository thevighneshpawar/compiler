import express from 'express';
import bodyParser from 'body-parser';
import { Octokit } from '@octokit/core';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Mimic __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/public`));

// Octokit.js
const octokit = new Octokit({
  auth: process.env.githubgist
});


app.get("/", function (req, res) {
    res.sendFile(__dirname+"/index.html")
})

app.post("/saveFile", async (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    const gistUrl = await createGist(fileName, fileData);
    res.json({ gistUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to save file");
  }
});

// Function to create a Gist
async function createGist(fileName, fileData) {
  const response = await octokit.request('POST /gists', {
    description: 'Example of a gist',
    'public': true,
    files: {
      [fileName]: {
        content: fileData
      }
    },
    "language": "plaintext",
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (response.status != 201) {
    throw new Error("Failed to create Gist");
  }

  return response.data.html_url;
}



app.post("/compile", function (req, res) {
    const code = req.body.code;
    const customInput = req.body.input;
    const langId = req.body.lang;
 console.log('compiling');
    try {
      
        const formData = {
            language_id: langId,
            source_code: Buffer.from(code).toString("base64"),
            stdin: Buffer.from(customInput).toString("base64"),
        };

        const options = {
            method: "POST",
            url: `https://judge0-ce.p.rapidapi.com/submissions`,
            params: { base64_encoded: "true", fields: "*" },
            headers: {
                "content-type": "application/json",
                "Content-Type": "application/json",
                'X-RapidAPI-Key': process.env.key,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            },
            data: formData,
        };
        // console.log(formData)

        axios
            .request(options)
            .then(function (response) {
                const token = response.data.token;
                // console.log(token);
                checkStatus(token, res);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ error: "Internal server error" });
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const checkStatus = async (token, res) => {
    const options = {
        method: "GET",
        url: "https://judge0-ce.p.rapidapi.com/submissions/" + token,
        params: { base64_encoded: "true", fields: "*" },
        headers: {
            'X-RapidAPI-Key': process.env.key,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
    };
    try {
        let response = await axios.request(options);
        let statusId = response.data.status?.id;

        // Processed - we have a result
        if (statusId === 1 || statusId === 2) {
            // still processing
            setTimeout(() => {
                checkStatus(token, res);
            }, 2000);
            return;
        }

        if (statusId >= 5) {
            const decodedData = response.data.status?.description;;
            res.send(decodedData);
            return decodedData;
        }
        
        else {
            const decodedData = atob(response.data.stdout);
            // console.log(decodedData);
            // console.log(response.status[1]);
            res.send(decodedData);
            return decodedData;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log("Server is running on port 8000");
});
