import { searchRepo } from './handler/search-repo';
import * as parse from "co-body";
import * as http from "http";
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as socketio from "socket.io";
const cors = require('@koa/cors');
import { getRepoList } from './handler/get-repo-list';
import { setUpImportRepo } from './handler/import';

const PORT = process.env.PORT || 3002;

const app = new Koa();
const router = new Router();

app.use(cors({
   "origin": "http://localhost:3000",
}));
app.use(router.routes());

const server = http.createServer(app.callback());
const io = socketio(server);

setUpImportRepo(io);


router.get('/github/webhook', async (ctx) => {
   const payload = await parse(ctx);
});

router.get("/repos", getRepoList);
router.get("/search", searchRepo);


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
