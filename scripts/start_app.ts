/**
 * start_app.ts
 */
import app from '../src/api/server';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`HireMe.ai Server is RUNNING!`);
  console.log(`Access the UI at: http://localhost:${PORT}`);
  console.log(`=================================`);
});
