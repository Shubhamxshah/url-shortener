import express from "express";

export const app = express();
app.use(express.json());

const urls = new Map();

app.post("/api/shorten", (req, res) => {
  const {url} = req.body;

  const id = generateRandom();
  urls.set(id, url);

  res.status(201).json({message: `shortened url is ${id}`})
})

app.get()

function generateRandom() {
  const letter = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  let result = '';

  for (let i=0; i<6; i++){
    result += letter[Math.floor(Math.random() * letter.length)]
  }

  return result;
}
