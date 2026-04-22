import { config } from 'dotenv';
import { createApp } from './app';

config();

const app = createApp();
const port = parseInt(process.env.PORT || '3000', 10);

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
});
