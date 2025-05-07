import express from 'express';
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import validUrl from "valid-url";

export const app = express();
app.use(express.json())


const urlDatabase = new Map();
const stats = new Map();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10
})

app.use(limiter);

function generateShortCode() {
  return crypto.randomBytes(3).toString('hex');
}

// Shorten a URl 
app.post('/api/shorten', (req, res) => {
  const {longUrl, expirationDate} = req.body;

  if (!validUrl.isUri(longUrl)) {
    res.status(400).json({error: 'Invalod Url'});
    return;
  }

  const shortCode =  generateShortCode();
  const expiresAt = expirationDate ? new Date(expirationDate) : null;

  urlDatabase.set(shortCode, {longUrl, expiresAt});
  stats.set(shortCode, {clicks: 0, createdAt: new Date()});

  const shortUrl = `http://localhost:3001/${shortCode}`;
  res.json({shortUrl, shortCode });
})


// Retrieve original Url 
app.get('/api/url/:shortCode', (req, res) => {
  
  const {shortCode} = req.params;
  const urlData = urlDatabase.get(shortCode);

  if (!urlData) {
    res.status(404).json({error: `Statistics not found`});
    return;
  }

  if (urlData.expiresAt && urlData.expiresAt < new Date()) {
    urlDatabase.delete(shortCode);
    stats.delete(shortCode);
    res.status(410).json({error: 'short URL has expired'});
  }

  res.json({ longUrl: urlData.longUrl });
});

// Get URL statistics 
app.get("/api/stats/:shortCode", (req, res) => {
  const {shortCode} = req.params; 
  const urlStats = stats.get(shortCode); 

  if (!urlStats) {
    res.status(404).json({ error: 'Statistics not found'});
    return;
  }

  res.json(urlStats);
})

// Redirect to Original URL 
app.get("/:shortCode", (req, res) => {
  const {shortCode} = req.params; 
  const urlData = urlDatabase.get(shortCode);

  if (!urlData) {
    res.status(404).send('Short URL not found');
  }

  if (urlData.expiresAt && urlData.expiresAt < new Date()) {
    urlDatabase.delete(shortCode); 
    stats.delete(shortCode);
    res.status(410).send('short URL has expired');
    return;
  }

  const urlStats = stats.get(shortCode);
  urlStats.clicks += 1;
  stats.set(shortCode, urlStats);

  res.redirect(301, urlData.longUrl);
})
