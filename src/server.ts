import { searchRepo } from './handler/search-repo';
import * as parse from "co-body";
import * as http from "http";
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as socketio from "socket.io";
const cors = require('@koa/cors');
import { getRepoList } from './handler/get-repo-list';
import { setUpImportRepo } from './handler/import';
import fetch from "node-fetch";
import { getMainServerUrl } from './utils/get-url';

const PORT = process.env.PORT || 80;

const app = new Koa();
const router = new Router();

app.use(cors({
   "origin": "http://localhost:3000",
}));
app.use(router.routes());

const server = http.createServer(app.callback());
const io = socketio(server);

setUpImportRepo(io);


router.post('/github/webhook', async (ctx) => {

   console.log("in hook")

   const payload = await parse(ctx);

   // tranform payload to commit
   const { repository, commit } = payload;
   const repoName = repository.name;
   const ownerId = repository.owner.name;

   console.log(commit);
   // const res = await fetch(`${getMainServerUrl()}/api/repository/new-commit`, {
   //    method: "POST",
   //    body: commit
   // }).then(res => res.json());
   // console.log(res);
});

router.get("/repos", getRepoList);
router.get("/search", searchRepo);


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
