import { app } from ".";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`server listening on PORT ${PORT}`);
})
