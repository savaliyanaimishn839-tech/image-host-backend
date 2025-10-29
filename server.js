import express from "express";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));

AWS.config.update({
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

app.get("/photos", async (req, res) => {
  const seed = req.query.seed;
  if (!seed || !/^[a-zA-Z]{5}\d{5}$/.test(seed))
    return res.status(400).json({ error: "Invalid seed" });

  try {
    const files = Array.from({ length: 5 }).map((_, i) =>
      `${seed}_${i + 1}.jpg`
    );

    const urls = files.map((key) =>
      s3.getSignedUrl("getObject", {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Expires: 60,
        ResponseCacheControl: "no-store",
        ResponseContentType: "image/jpeg",
        ResponseContentDisposition: "inline",
      })
    );

    res.set("X-Robots-Tag", "noindex, noarchive");
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
